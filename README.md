# NoteCam

NoteCam is an iPhone-first note capture app built with Expo and React Native. It lets you photograph lecture slides, whiteboards, and class notes, extract the text with OCR, and append that text directly into a chosen Google Doc through a Google Apps Script backend.

## Why I built it

I wanted a faster way to move class material from a lecture room into structured notes without manually retyping everything. The app focuses on a simple flow:

1. choose a target Google Doc
2. capture a classroom image
3. extract text
4. append the result into the doc

## Features

- Multi-doc workflow
  - save multiple Google Docs locally
  - choose an active doc
  - set a default doc
- Direct Google Docs import
  - connect a Google account
  - import recent docs from Drive metadata
- Capture and OCR flow
  - capture images in-app
  - preview before upload
  - extract OCR text from the image
  - optionally review OCR before appending
- History
  - track uploads and OCR runs
  - reopen OCR text from past entries
  - delete single history entries or clear all history
  - delete local image files independently of history
- Manual cleanup
  - remove all local image copies without touching history or Google Docs
- Dark cyberpunk-inspired UI
  - custom dark palette
  - neon cyan / magenta accents
  - portfolio-focused visual pass for the iPhone app

## Stack

- Expo
- React Native
- TypeScript
- AsyncStorage
- Expo Camera
- Google Apps Script
- Google Docs / Drive integration

## How it works

### Frontend

The app stores doc selections, settings, OCR drafts, and history locally on-device. Images are captured on iPhone, stored temporarily inside the app, and then passed to the backend for OCR and Google Docs append operations.

### Backend

The backend is a Google Apps Script web app. It:

- receives the image payload
- performs OCR through the Drive-based Apps Script flow
- appends formatted text into the selected Google Doc
- returns OCR text and status back to the app

## Project structure

```text
.
├── App.tsx
├── app.json
├── assets/
├── backend/
│   ├── Code.gs
│   ├── README.md
│   └── appsscript.json
├── ios/
├── src/
│   ├── components/
│   ├── constants/
│   ├── context/
│   ├── screens/
│   ├── services/
│   ├── storage/
│   ├── types/
│   └── utils/
└── package.json
```

## Local setup

### Prerequisites

- Node 22
- Xcode
- CocoaPods
- a physical iPhone or iOS Simulator

### Install

```bash
npm install
```

### Type-check

```bash
npm run typecheck
```

### Run on iPhone

```bash
nvm use 22
npm run ios:device:release
```

### Run on simulator

```bash
npm run ios
```

## Backend setup

1. Create a standalone Google Apps Script project.
2. Copy in `backend/Code.gs`.
3. Enable the manifest file and copy in `backend/appsscript.json`.
4. Enable the Advanced Drive service with Drive API `v3`.
5. Deploy the script as a web app.
6. Paste the `/exec` deployment URL into NoteCam Settings.

The web app should run as:

- Execute as: `Me`
- Who has access: `Anyone with the link`

## Google account import setup

If you want in-app Google Docs import:

1. Create an iOS OAuth client in Google Cloud.
2. Use your app bundle identifier for the iOS client.
3. Paste the generated iOS client ID into NoteCam Settings.
4. Connect your Google account from the Docs screen.

## Notes for publishing

- This repo is set up for local development and portfolio/demo use.
- Before publishing your own fork, use your own Apple signing config and Google Cloud / Apps Script setup.
- Do not commit real OAuth tokens, deployment URLs, or personal production credentials.

## Screenshots

Add your iPhone screenshots or a short demo GIF here before publishing to GitHub. That will make the repo much stronger as a showcase project.

## OCR status

The OCR UI flow and backend integration layer are implemented, but full OCR is intentionally guarded until the backend is configured.

### What is currently stubbed

- The OCR request will return a clear error until backend OCR is enabled.

### Exact next step to finish OCR

1. In Apps Script, enable the Advanced Drive service.
2. In the linked Google Cloud project, enable the Drive API.
3. In [backend/Code.gs](/Users/nishoberoi/NoteCam/backend/Code.gs), set `ENABLE_DRIVE_OCR = true`.
4. Redeploy the web app.

After that, the existing `Extract text` button path will start calling the OCR backend instead of returning the setup message.

## Notes

- This is a single-user MVP.
- There is no auth layer.
- Docs, settings, and history are all local to the device.
- `.env.example` is included only as a reference template. The current MVP uses the Settings screen for backend configuration.

## Troubleshooting (Mac)

- If `npm run ios` fails with simulator/device issues, open Xcode once, then retry.
- If build fails after dependency changes, run:

```bash
rm -rf ios build
npx expo prebuild --platform ios
npm run ios
```

- If Metro seems stale, restart with cache clear:

```bash
npx expo start -c
```
