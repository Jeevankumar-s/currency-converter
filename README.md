# Currency Converter

## Build an installable Android APK

The `preview` profile in `eas.json` produces a standalone APK.

```sh
npm ci
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

On first run, allow EAS to create/link the Expo project and generate an Android signing keystore. Save access to that keystore for future updates. Download the APK from the build URL when the cloud build completes.

A React Native app built with Expo and TypeScript for **USD → INR** and **EUR → INR**.

## Features

- Navy and mint interface, custom rupee icon, currency tabs, and quick amount buttons.
- Instant conversion with Indian number formatting.
- Daily exchange rates from the public [Frankfurter v2 API](https://frankfurter.dev/), without an API key.
- Rate date, manual refresh, loading/error states, and saved rates for offline use.
- Amount validation (0–1 billion, up to two decimal places).
- Accessible controls and a scrollable layout for smaller screens.

## Run

Use Node.js 24 and npm.

```sh
npm ci
npm start
```

Scan the QR code with a compatible Expo Go version on Android or iOS. If Expo Go does not yet support SDK 57, use an Expo development build instead.

```sh
npm run android   # Android emulator/device
npm run ios       # iOS simulator on macOS
npm run web       # Browser
```

The project uses Expo SDK 57 / React Native 0.86. Native projects can be generated with `npx expo prebuild`. Android and iOS signing credentials are needed for store releases and are not included.

## Checks

```sh
npm run typecheck
npm test
npx expo install --check
npx expo export --platform all
```

GitHub Actions runs the same checks on pushes and pull requests.

## Rate behavior

Both currency rates are fetched at launch and when Refresh is pressed. Successful responses are saved locally; if a later refresh fails, the app displays the saved rate with its original date. No invented fallback rates are used. Requests time out after 12 seconds. Conversion is amount × rate and is rounded for display to two decimal places.

Frankfurter supplies daily reference rates, not real-time executable prices. Banks and payment providers may apply different rates and fees. Internet access is required to load fresh rates.
