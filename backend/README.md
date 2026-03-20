# NoteCam Google Apps Script Backend

This backend receives image uploads from the Expo app and appends them into a selected Google Doc.

## Files

- `Code.gs`: Web app handlers and Google Docs append logic
- `appsscript.json`: Apps Script manifest

## Setup

1. Create a new standalone Google Apps Script project.
2. Copy `Code.gs` and `appsscript.json` into that project.
3. In Apps Script:
   - enable the Google Docs service (available by default)
   - if you want OCR, enable the Advanced Drive service
   - use Drive API `v3`
4. Set `ENABLE_DRIVE_OCR`:
   - leave `false` for the current clean MVP without OCR
   - change to `true` only after the Advanced Drive service is enabled
5. Deploy as a Web App:
   - Execute as: `Me`
   - Who has access: `Anyone with the link`
6. Copy the deployment URL into the app Settings screen.

## Supported actions

- `GET /exec`: health response
- `POST { action: "uploadImage", ... }`: append image and metadata into a Google Doc
- `POST { action: "extractOcr", ... }`: OCR endpoint (returns a clear error until OCR is enabled)
- `POST { action: "appendOcrText", ... }`: append OCR text into a Google Doc

## OCR note

The OCR path is intentionally guarded. Apps Script OCR via Drive is workable but requires:

1. Advanced Drive service enabled in Apps Script
2. The linked Google Cloud project to have the Drive API enabled
3. `ENABLE_DRIVE_OCR = true`

Until those steps are done, the app UI will still function and return a clear backend message instead of failing silently.
