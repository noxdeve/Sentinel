# Sentinel

<p align="center">
  <strong>A secure, offline-first password manager.</strong>
  <br />
  Built with Rust and Tauri for Linux and Android.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Rust-Powered-orange?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Android-lightgrey" alt="Platforms" />
</p>

---

## Overview

Sentinel is a privacy-focused password manager designed to provide secure, local credential storage without relying on cloud services.

Built with Rust and Tauri, Sentinel combines a lightweight application architecture with modern cryptographic technologies to keep sensitive information protected and under the user's control.

**Your credentials. Your device. Your control.**

## Features

- **Encrypted Storage** — Protect sensitive credentials with authenticated encryption.
- **Offline-first** — Access and manage your passwords without an internet connection.
- **Local Data Ownership** — Keep your credential data stored locally.
- **Secure Key Derivation** — Use Argon2 for password-based key derivation.
- **Lightweight** — Powered by Rust and Tauri.
- **Cross-platform** — Designed for Linux and Android.

## Technology Stack

| Technology | Role |
|---|---|
| Rust | Core application logic |
| Tauri | Application framework |
| React | User interface |
| TypeScript | Frontend development |
| SQLite | Local data storage |
| Argon2 | Key derivation |
| AES-256-GCM | Authenticated encryption |

## Security & Privacy

Security and privacy are fundamental principles of Sentinel.

- Credentials are encrypted before persistent storage.
- Password-based key derivation helps protect encryption keys.
- Sensitive data is managed locally.
- Core password management does not require cloud connectivity.

Sentinel is designed with a local-first security model. However, it has not been independently audited, and users should evaluate its security before relying on it for critical credentials.

## Supported Platforms

| Platform | Availability |
|---|---|
| Linux | Development builds |
| Android | Development builds |

Pre-built packages are published through GitHub Releases.

## Installation

### Download

Visit the Releases page to find available builds:

[**Download Sentinel →**](https://github.com/noxdeve/Sentinel/releases)

### Build from Source

#### Prerequisites

- Git
- Rust (stable)
- Node.js
- npm
- Tauri development dependencies

#### Clone the repository

```bash
git clone https://github.com/noxdeve/Sentinel.git
cd Sentinel
```

#### Install dependencies

```bash
npm install
```

#### Run in development mode

```bash
npm run tauri dev
```

#### Build the application

```bash
npm run tauri build
```

> Platform-specific dependencies may be required depending on your operating system and target architecture.

## Project Status

Sentinel is currently under active development.

The project aims to provide a reliable, lightweight, and privacy-focused password management experience across supported platforms.

Features and implementation details may evolve between releases.

## Roadmap

- [x] Rust-based application core
- [x] Local database integration
- [x] Password-based key derivation
- [x] Encrypted credential storage
- [x] Linux support
- [x] Android support
- [ ] Comprehensive security audit
- [ ] Automated security testing
- [ ] Improved backup and recovery workflows
- [ ] Additional platform support

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you encounter a bug or have an idea for improvement, feel free to open an issue or submit a pull request.

## License

Sentinel is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Sentinel</strong>
  <br />
  Privacy by design. Security by default.
  <br /><br />
  Developed by <a href="https://github.com/noxdeve">noxdeve</a>
</p>
