# Currency Converter

A standard **React Native Community CLI** app using React Native 0.86.3 and TypeScript. No Expo, EAS, or Expo sign-in is used.

Converts **USD → INR** and **EUR → INR** with a navy-and-mint UI, currency tabs, quick amounts, Indian number formatting, dated reference rates, manual refresh, and saved-rate fallback when offline.

## Get your APK from GitHub

1. Open [Actions → Build Android APK](https://github.com/Jeevankumar-s/currency-converter/actions/workflows/checks.yml).
2. A build starts automatically on each push to `main`. You can also click **Run workflow**, choose `main`, and run it.
3. Open the completed green run. Under **Artifacts**, download **currency-converter-apk**.
4. Extract the ZIP, copy **currency-converter.apk** to your Android phone, and open it to install. Enable installation from that source if Android asks.

GitHub builds the native Android project with Gradle. No Expo account, Android Studio on your computer, or repository secrets are needed for this test APK. This artifact includes the JavaScript bundle and runs without a development server. The workflow targets ARM64 and ARMv7 Android phones (Android 7.0 or later).

The APK uses React Native's standard public debug signing key for personal testing. To publish to Google Play, configure your own private release signing key and build an AAB; do not commit private signing credentials.

## Build an APK on your computer

Install Node.js 24, JDK 17, and Android Studio. In SDK Manager, install Android SDK Platform 36, Build Tools 36.0.0, NDK 27.1.12297006, and CMake 3.22.1. Configure `ANDROID_HOME` to your Android SDK location or set `sdk.dir` in `android/local.properties` (this file is ignored by git).

```sh
git clone https://github.com/Jeevankumar-s/currency-converter.git
cd currency-converter
npm ci
```

On Windows:

```bat
cd android
gradlew.bat assembleRelease
```

On macOS/Linux:

```sh
cd android
./gradlew assembleRelease
```

Your APK will be at **android/app/build/outputs/apk/release/app-release.apk**.

## Development

```sh
npm start
# In a second terminal, with an emulator or USB-connected phone:
npm run android
```

The iOS native project is also included. It requires macOS, Xcode, and CocoaPods:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run bundle:android
```

## Exchange rates

Rates come from the public [Frankfurter v2 API](https://frankfurter.dev/) without an API key. Both pairs load at launch and on refresh. Requests time out after 12 seconds. Successful rates are saved locally; if refresh fails, saved rates are shown with their date. Amounts from zero to 1 billion with up to two decimal places are accepted.

These are daily reference estimates. Bank rates and fees may differ. Internet access is required for fresh rates.
