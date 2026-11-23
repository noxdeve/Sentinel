buildscript {
    repositories {
        google()
        mavenCentral()
        // Google Maven (dl.google.com) is unreachable on some networks, which
        // makes the biometric plugin's AndroidX dependency unresolvable. Keep
        // the official repositories first and fall back to a mirror.
        maven("https://maven.aliyun.com/repository/google")
    }
    dependencies {
        classpath("com.android.tools.build:gradle:9.3.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.10")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven("https://maven.aliyun.com/repository/google")
    }
}

tasks.register("clean").configure {
    delete("build")
}

