//! Sentinel — encrypted password vault.
//!
//! The master password is never stored. It is hashed with Argon2id for
//! verification and, using a separate random salt, stretched into a 256-bit
//! key that encrypts the whole vault payload with AES-256-GCM. Only the
//! derived key lives in memory, and only while the vault is unlocked.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use aes_gcm::aead::{Aead, Generate, KeyInit, Nonce};
use aes_gcm::Aes256Gcm;
use argon2::password_hash::{phc::PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::Argon2;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager, State};

/// 32-byte key for AES-256.
type VaultKey = [u8; 32];

/// Length of the public KDF salt stored alongside the user record.
const SALT_LEN: usize = 16;

const DB_FILE: &str = "vault.db";
/// Legacy database filename used by earlier builds (created in the CWD).
const LEGACY_DB_FILE: &str = "user.db";

const SCHEMA: &str = "
    CREATE TABLE IF NOT EXISTS user (
        id       INTEGER PRIMARY KEY CHECK (id = 1),
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        salt     BLOB
    );
    CREATE TABLE IF NOT EXISTS vault (
        id         INTEGER PRIMARY KEY CHECK (id = 1),
        nonce      BLOB NOT NULL,
        ciphertext BLOB NOT NULL,
        updated_at INTEGER NOT NULL
    );
";

/// In-memory unlock state. The key is cleared on lock.
#[derive(Default)]
struct VaultState {
    key: Mutex<Option<VaultKey>>,
}

/* ------------------------------------------------------------------ */
/* crypto primitives                                                   */
/* ------------------------------------------------------------------ */

/// Argon2id hash of the master password (used only for verification).
fn hash_master(password: &str) -> Result<String, String> {
    Argon2::default()
        .hash_password(password.as_bytes())
        .map(|hash| hash.to_string())
        .map_err(|e| e.to_string())
}

/// Constant-time verification of the master password against its PHC hash.
fn verify_master(password: &str, phc: &str) -> bool {
    match PasswordHash::new(phc) {
        Ok(parsed) => Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok(),
        Err(_) => false,
    }
}

/// Stretch the master password into the vault encryption key.
fn derive_key(password: &str, salt: &[u8]) -> Result<VaultKey, String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

/// Encrypt `plaintext`, returning `(nonce, ciphertext)`.
fn encrypt(key: &VaultKey, plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let nonce = Nonce::<Aes256Gcm>::generate();
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| e.to_string())?;
    Ok((nonce.as_slice().to_vec(), ciphertext))
}

/// Decrypt `ciphertext` produced by [`encrypt`].
fn decrypt(key: &VaultKey, nonce: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let nonce =
        Nonce::<Aes256Gcm>::try_from(nonce).map_err(|_| "corrupt nonce".to_string())?;
    cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| "vault could not be decrypted".to_string())
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/* ------------------------------------------------------------------ */
/* database                                                            */
/* ------------------------------------------------------------------ */

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(DB_FILE))
}

/// Open (creating if needed) the vault database, applying the schema and
/// migrating an older `user.db` from the working directory when present.
fn open_db(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    if !path.exists() {
        if let Ok(cwd) = std::env::current_dir() {
            let legacy = cwd.join(LEGACY_DB_FILE);
            if legacy.is_file() {
                let _ = std::fs::copy(&legacy, &path);
            }
        }
    }

    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    conn.execute_batch(SCHEMA).map_err(|e| e.to_string())?;
    ensure_salt_column(&conn)?;
    Ok(conn)
}

/// Older installs created the `user` table without a KDF salt column.
/// Add it when missing so those accounts keep working.
fn ensure_salt_column(conn: &Connection) -> Result<(), String> {
    let columns: Vec<String> = {
        let mut stmt = conn
            .prepare("PRAGMA table_info(user)")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .map_err(|e| e.to_string())?;
        rows.filter_map(Result::ok).collect()
    };

    if !columns.iter().any(|name| name == "salt") {
        conn.execute("ALTER TABLE user ADD COLUMN salt BLOB", [])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn account_exists(conn: &Connection) -> Result<bool, String> {
    conn.query_row("SELECT EXISTS(SELECT 1 FROM user WHERE id = 1)", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

/* ------------------------------------------------------------------ */
/* commands                                                            */
/* ------------------------------------------------------------------ */

/// Whether a master account has been created on this device.
#[tauri::command]
fn user_status(app: AppHandle) -> Result<bool, String> {
    let conn = open_db(&app)?;
    account_exists(&conn)
}

/// Create the single master account and initialise an empty encrypted vault.
#[tauri::command]
fn add_user(
    app: AppHandle,
    state: State<'_, VaultState>,
    username: String,
    password: String,
) -> Result<bool, String> {
    let username = username.trim().to_string();
    if username.len() < 3 {
        return Err("Username must be at least 3 characters".into());
    }
    if password.len() < 6 {
        return Err("Password must be at least 6 characters".into());
    }

    let conn = open_db(&app)?;
    if account_exists(&conn)? {
        return Err("An account already exists on this device".into());
    }

    let phc = hash_master(&password)?;
    let salt: [u8; SALT_LEN] = Generate::generate();

    conn.execute(
        "INSERT INTO user (id, username, password, salt) VALUES (1, ?1, ?2, ?3)",
        params![username, phc, salt.to_vec()],
    )
    .map_err(|e| e.to_string())?;

    let key = derive_key(&password, &salt)?;
    let (nonce, ciphertext) = encrypt(&key, b"[]")?;
    conn.execute(
        "INSERT INTO vault (id, nonce, ciphertext, updated_at) VALUES (1, ?1, ?2, ?3)",
        params![nonce, ciphertext, now_ms()],
    )
    .map_err(|e| e.to_string())?;

    *state.key.lock().unwrap() = Some(key);
    Ok(true)
}

/// Verify the master password and cache the derived key for this session.
#[tauri::command]
fn check_password(
    app: AppHandle,
    state: State<'_, VaultState>,
    password: String,
) -> Result<bool, String> {
    let conn = open_db(&app)?;
    let row: Option<(String, Option<Vec<u8>>)> = conn
        .query_row("SELECT password, salt FROM user WHERE id = 1", [], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .optional()
        .map_err(|e| e.to_string())?;

    let Some((phc, stored_salt)) = row else {
        return Ok(false);
    };
    if !verify_master(&password, &phc) {
        return Ok(false);
    }

    // Legacy accounts may not have a salt yet; mint one on first unlock.
    let salt = match stored_salt {
        Some(bytes) if bytes.len() >= 8 => bytes,
        _ => {
            let fresh: [u8; SALT_LEN] = Generate::generate();
            conn.execute(
                "UPDATE user SET salt = ?1 WHERE id = 1",
                params![fresh.to_vec()],
            )
            .map_err(|e| e.to_string())?;
            fresh.to_vec()
        }
    };

    *state.key.lock().unwrap() = Some(derive_key(&password, &salt)?);
    Ok(true)
}

/// The account's display name (readable while locked).
#[tauri::command]
fn get_username(app: AppHandle) -> Result<String, String> {
    let conn = open_db(&app)?;
    conn.query_row("SELECT username FROM user WHERE id = 1", [], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No account on this device".to_string())
}

/// Decrypt and return the vault payload as JSON.
#[tauri::command]
fn load_items(app: AppHandle, state: State<'_, VaultState>) -> Result<String, String> {
    let key = state
        .key
        .lock()
        .unwrap()
        .as_ref()
        .copied()
        .ok_or("Vault is locked")?;

    let conn = open_db(&app)?;
    let row: Option<(Vec<u8>, Vec<u8>)> = conn
        .query_row("SELECT nonce, ciphertext FROM vault WHERE id = 1", [], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .optional()
        .map_err(|e| e.to_string())?;

    let Some((nonce, ciphertext)) = row else {
        return Ok("[]".into());
    };

    let plaintext = decrypt(&key, &nonce, &ciphertext)?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

/// Encrypt and persist the vault payload (a JSON string).
#[tauri::command]
fn save_items(
    app: AppHandle,
    state: State<'_, VaultState>,
    items: String,
) -> Result<(), String> {
    // Reject anything that is not a valid JSON payload before encrypting it.
    serde_json::from_str::<serde_json::Value>(&items)
        .map_err(|_| "Invalid vault payload".to_string())?;

    let key = state
        .key
        .lock()
        .unwrap()
        .as_ref()
        .copied()
        .ok_or("Vault is locked")?;

    let (nonce, ciphertext) = encrypt(&key, items.as_bytes())?;
    let conn = open_db(&app)?;
    conn.execute(
        "INSERT INTO vault (id, nonce, ciphertext, updated_at) VALUES (1, ?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
            nonce      = excluded.nonce,
            ciphertext = excluded.ciphertext,
            updated_at = excluded.updated_at",
        params![nonce, ciphertext, now_ms()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Drop the in-memory key so the vault must be unlocked again.
#[tauri::command]
fn lock_vault(state: State<'_, VaultState>) -> Result<(), String> {
    let mut guard = state.key.lock().unwrap();
    if let Some(key) = guard.as_mut() {
        key.fill(0);
    }
    *guard = None;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(VaultState::default())
        .invoke_handler(tauri::generate_handler![
            user_status,
            add_user,
            check_password,
            get_username,
            load_items,
            save_items,
            lock_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key_for(password: &str, salt: &[u8]) -> VaultKey {
        derive_key(password, salt).expect("key derivation")
    }

    #[test]
    fn derive_key_is_deterministic_and_salt_dependent() {
        let salt = [7u8; SALT_LEN];
        assert_eq!(key_for("master-pass", &salt), key_for("master-pass", &salt));
        assert_ne!(key_for("master-pass", &salt), key_for("master-pass", &[8u8; SALT_LEN]));
        assert_ne!(key_for("master-pass", &salt), key_for("other-pass", &salt));
    }

    #[test]
    fn encrypt_then_decrypt_roundtrips() {
        let key = key_for("master-pass", &[1u8; SALT_LEN]);
        let (nonce, ciphertext) = encrypt(&key, b"top secret vault payload").unwrap();
        assert_ne!(ciphertext.as_slice(), b"top secret vault payload");
        let plaintext = decrypt(&key, &nonce, &ciphertext).unwrap();
        assert_eq!(plaintext, b"top secret vault payload");
    }

    #[test]
    fn decrypt_rejects_wrong_key_or_tampering() {
        let key = key_for("master-pass", &[2u8; SALT_LEN]);
        let wrong = key_for("wrong-pass", &[2u8; SALT_LEN]);
        let (nonce, ciphertext) = encrypt(&key, b"payload").unwrap();
        assert!(decrypt(&wrong, &nonce, &ciphertext).is_err());

        let mut tampered = ciphertext.clone();
        tampered[0] ^= 0xff;
        assert!(decrypt(&key, &nonce, &tampered).is_err());
    }

    #[test]
    fn master_hash_verifies_only_the_right_password() {
        let phc = hash_master("correct horse battery staple").unwrap();
        assert!(verify_master("correct horse battery staple", &phc));
        assert!(!verify_master("incorrect", &phc));
        assert!(!verify_master("correct horse battery staple", "not a hash"));
    }
}
