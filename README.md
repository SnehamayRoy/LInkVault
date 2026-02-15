# LinkVault

## Overview

LinkVault is a pastebin-style app that lets users share plain text or a file through a private, unique URL. Links are not listed anywhere and expire automatically.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

## Local Setup

### Backend

1. `cd backend`
2. `npm install`
3. `node index.js`

Backend runs at `http://localhost:5000`.

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend runs at `http://localhost:5173`.

## API Overview

- `POST /upload`
  - Body: multipart form-data with either `text` or `file`
  - Optional: `expiresAt` (ISO string), `password`, `oneTime`, `maxViews`, `maxDownloads`
  - Response: `{ id, apiLink }`
- `GET /v/:id`
  - Returns JSON for text content or file metadata
  - 403 for invalid link, 410 for expired
- `GET /v/:id/download`
  - Downloads the file if the link is valid
- `DELETE /v/:id`
  - Deletes link if no owner is set (password required if protected)
- `POST /auth/register`, `POST /auth/login`
  - Returns JWT token + user info
- `GET /auth/me`
  - Requires JWT
- `GET /me/vaults`, `DELETE /me/vaults/:id`
  - Requires JWT, owner-only operations

## Database Schema (Vault)

- `id`: String (unique share id)
- `type`: "text" | "file"
- `content`: String (optional)
- `filePath`: String (optional)
- `fileName`: String (optional)
- `fileSize`: Number (optional)
- `mimeType`: String (optional)
- `passwordHash`: String (optional)
- `oneTime`: Boolean
- `consumedAt`: Date (optional)
- `maxViews`: Number (optional)
- `maxDownloads`: Number (optional)
- `viewCount`: Number
- `downloadCount`: Number
- `expiresAt`: Date
- `createdAt`: Date
- `ownerId`: ObjectId (optional)

## Design Decisions

- Links are generated with `nanoid` to make them hard to guess.
- MongoDB TTL index is used for auto-expiry of documents.
- File cleanup runs periodically to delete expired uploads from disk.
- JWT auth lets users manage their own vaults without removing link-based access.
- File validation uses a 10 MB size limit and a safe default MIME allowlist.

## Assumptions & Limitations

- Accounts are optional; link-based sharing still works without login.
- Files are stored locally in `backend/uploads`.
- Default expiry is 10 minutes if not specified.

## Data Flow Diagram

See `docs/data-flow.md`.
