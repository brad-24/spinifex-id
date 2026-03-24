# Spinifex ID

A mobile-first plant identification app built with Expo (React Native) that uses Claude AI vision to identify whether a plant is spinifex — Australia's iconic arid-zone grass.

## Features

- **Camera or photo library** — take a fresh photo or upload an existing one
- **AI identification** — powered by Claude's vision capability (`claude-sonnet-4-20250514`)
- **Spinifex verdict** — clear yes/no answer with species name
- **Confidence rating** — high / medium / low confidence indicator
- **Key features** — visual characteristics used in the identification
- **Habitat & distribution** — where the plant grows across Australia
- **Land management notes** — fire ecology, pastoral, and revegetation context
- **Non-spinifex suggestions** — if the plant is something else, get a suggested alternative
- **Runs on iOS, Android, and web** via Expo

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- An [Anthropic API key](https://console.anthropic.com/)
- For native builds: iOS Simulator (macOS) or Android Studio

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd spinifex-id
npm install
```

### 2. Configure your API key

Copy the example environment file and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> **Note:** The `EXPO_PUBLIC_` prefix makes the variable available in the client bundle. Keep your API key out of version control — `.env` is already in `.gitignore`.

### 3. Start the development server

```bash
npm start
```

This opens the Expo dev server. From there:

- Press `i` to open in iOS Simulator (macOS only)
- Press `a` to open in Android Emulator
- Press `w` to open in your web browser
- Scan the QR code with the [Expo Go](https://expo.dev/client) app on your device

## Running on specific platforms

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

## Project structure

```
spinifex-id/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root navigation layout
│   ├── index.tsx               # Home screen
│   ├── identify.tsx            # Camera / photo picker screen
│   └── results.tsx             # Identification results screen
├── constants/
│   └── colors.ts               # Earthy Australian colour palette
├── services/
│   └── plantIdentification.ts  # Claude API integration
├── store/
│   └── resultStore.ts          # Simple in-memory result store
├── types/
│   └── plant.ts                # TypeScript types
├── .env.example                # Environment variable template
├── app.json                    # Expo configuration
└── package.json
```

## How it works

1. User opens the app and taps **Identify a Plant**
2. The camera or photo library is opened to capture/select a plant photo
3. The image is encoded as base64 and sent to the Anthropic Messages API
4. Claude analyses the image using a botanist system prompt and returns structured JSON
5. The results screen displays the verdict, confidence, features, habitat, and management notes
6. Tap **Try Another Plant** to identify a new image

## Colour palette

The UI uses an earthy, Australian-inspired palette:

| Role | Colour |
|---|---|
| Background | Sandy cream `#FBF3E0` |
| Primary (ochre) | `#C17F24` |
| Accent (eucalyptus) | `#5C7A3E` |
| Text | Dark earth `#2C1810` |

## Notes

- API calls are made directly from the client using `EXPO_PUBLIC_ANTHROPIC_API_KEY`. This is intentional for a personal/demo app but **do not use this pattern in a production app** that will be distributed to the public — proxy API calls through your own server instead.
- AI identifications are for guidance only. Always verify with local botanists or agronomists for land management, stock safety, or commercial decisions.
