# Product Spec

## App name

NoteCam

## User

Single user only (me)

## Core user flow

1. Open app
2. See saved Google Docs
3. Select one doc as target
4. Tap camera
5. Take photo
6. Upload photo to backend with:
   - selected doc ID
   - doc name
   - timestamp
   - optional note/title
7. Backend appends entry into the selected Google Doc:
   - timestamp
   - optional label
   - image
   - optional OCR text
8. App stores local metadata for cleanup
9. Uploaded local image is deleted after X days

## Features

### A. Multi-doc management

- Add Google Doc by name + doc ID
- View list of saved docs
- Set one as default
- Choose active doc before capture

### B. Camera upload

- In-app camera only
- Save image temporarily in app storage
- Upload to backend
- Show success/failure state

### C. OCR extraction

- User can run text extraction on captured or selected image
- Show extracted text in copyable text area
- Buttons:
  - Copy text
  - Append extracted text to selected doc

### D. Cleanup

- Setting: delete after X days
- Default = 2
- Delete only local app copy, never the Google Doc content
- Cleanup runs on app open and after successful upload

## Suggested screens

1. Docs screen
2. Camera screen
3. OCR/result screen
4. History screen
5. Settings screen

## Backend

Use Google Apps Script Web App endpoint.

Needed backend actions:

- upload image to selected doc
- append OCR text to selected doc
- simple health check

## Output format in Google Doc

For each upload, append:

- separator
- date/time
- selected doc label or class label
- inserted image
- optional extracted text

## Non-goals for MVP

- multi-user auth
- fancy cloud sync
- sharing/collaboration
- polished production deployment
