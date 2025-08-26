import os from 'os';
import path from 'path';

export const CONFIG = {
  avd: {
    name: 'Pixel_7_API_35',
    deviceId: 'pixel_7',
    systemImage: 'system-images;android-35;google_apis;x86_64',
    packagePath: 'system-images;android-35;google_apis;x86_64',
    sdCardSize: '2048M',
    ramSize: 4096,
    gpu: {
      enabled: true,
      mode: 'swiftshader_indirect',
    },
  },

  ankidroid: {
    version: '2.22.3',
    packageName: 'com.ichi2.anki',
    apkDir: 'third-party-apks',
  },

  emulator: {
    display: ':1',
    vncPort: 5901,
    bootTimeout: parseInt(process.env.EMU_BOOT_TIMEOUT || '120'), // 2 minutes default, configurable via env
    bootCheckInterval: 2,
    options: {
      noAudio: true,
      noBootAnim: true,
      noMetrics: true,
    },
  },

  paths: {
    androidHome: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '',
    avdHome: path.join(os.homedir(), '.android', 'avd'),
  },
};

export function getAndroidPaths() {
  const androidHome = CONFIG.paths.androidHome;
  if (!androidHome) {
    throw new Error('ANDROID_HOME or ANDROID_SDK_ROOT environment variable not set');
  }

  return {
    androidHome,
    cmdlineTools: path.join(androidHome, 'cmdline-tools', 'latest', 'bin'),
    platformTools: path.join(androidHome, 'platform-tools'),
    emulator: path.join(androidHome, 'emulator'),
    adb: path.join(androidHome, 'platform-tools', 'adb'),
    avdmanager: path.join(androidHome, 'cmdline-tools', 'latest', 'bin', 'avdmanager'),
    sdkmanager: path.join(androidHome, 'cmdline-tools', 'latest', 'bin', 'sdkmanager'),
    emulatorBin: path.join(androidHome, 'emulator', 'emulator'),
  };
}

export function getAnkidroidApkUrl(version: string = CONFIG.ankidroid.version): string {
  return `https://github.com/ankidroid/Anki-Android/releases/download/v${version}/AnkiDroid-${version}-full-universal.apk`;
}
