# Currency Converter

This is a standard React Native Community CLI project using React Native 0.86.3 and TypeScript. The user explicitly requested no Expo. Do not add Expo or EAS dependencies or account requirements.

Android and iOS projects are checked in and maintained directly. Use npm ci, npm run lint, npm run typecheck, and npm test. Android release APKs are built with android/gradlew assembleRelease or gradlew.bat on Windows. The APK workflow builds and uploads a standalone test APK on main pushes and manual runs.

Preserve USD/EUR to INR conversion and the navy/mint UI. Fetch actual reference rates; never add invented rates. Use React Native core APIs and Community CLI-compatible libraries.

Run lint, typecheck, tests, and an Android JavaScript bundle before pushing changes. Release builds currently use the standard public React Native debug keystore for personal testing. Store publication requires the owner's private signing configuration, outside git.
