# BeeBark — Professional Networking Platform

BeeBark is a full-stack professional networking application: profiles, posts, connections,
real-time messaging, job postings with AI-assisted matching, video meetings, and stories.

- **Frontend:** React 19 (Create React App + CRACO), Tailwind CSS, Radix UI, Socket.IO client
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary, JWT auth

## Project structure

```
backend/    Express API + Socket.IO server
frontend/   React single-page app
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local or MongoDB Atlas)
- (Optional) Cloudinary account for image/resume uploads
- (Optional) SMTP credentials for password-reset emails
- (Optional) OpenAI API key for AI job matching (falls back to keyword matching if unset)

## Setup

### Backend

```bash
cd backend
cp .env.example .env      # fill in real values
npm install
npm start                 # starts on http://localhost:8001
```

### Frontend

```bash
cd frontend
cp .env.example .env      # point REACT_APP_BACKEND_URL at the backend
npm install               # or: yarn install
npm start                 # dev server on http://localhost:3000
```

## Production build

```bash
cd frontend
npm run build             # outputs static assets to frontend/build
```

Serve `frontend/build` from any static host (or behind the same origin as the API) and run the
backend with `NODE_ENV=production`. In production set `CORS_ORIGINS` to your real frontend
domain(s) — a comma-separated list — instead of `*`.

## Environment variables

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example)
for the full list. **Never commit real secrets** — only `*.env.example` files are tracked.
