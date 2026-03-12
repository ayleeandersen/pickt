# Pickt 🍕🎬

> Stop arguing. Start swiping.

A group decision-making app for friends who can never agree on where to eat or what to watch. Swipe yes/no on options, see what the group matched on, sorted by votes.

---

## Tech Stack

- **Frontend** — React + Vite (deployed as static site on Vercel)
- **API Proxy** — Vercel Serverless Functions (`/api/`)
- **Realtime Sync** — Firebase Realtime Database
- **APIs** — Google Places (restaurants) + TMDB (movies)

---

## Deploy to Vercel (free, ~5 minutes)

### 1. Get your API keys

**Google Places API**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Places API**
3. Go to Credentials → Create API Key
4. (Recommended) Restrict it to your Vercel domain

**TMDB API**
1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
2. Go to Settings → API → Request an API key (free, instant)
3. Copy the **API Key (v3 auth)** value

**Firebase Realtime Database**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Build → Realtime Database → Create database
3. Start in **test mode** (you can add security rules later)
4. Go to Project Settings → Your apps → Add web app
5. Copy the full config object — make sure it includes `databaseURL`

---

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Pickt"
gh repo create pickt --public --push
# or push manually to github.com
```

---

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework preset: **Vite** (auto-detected)
4. Click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `GOOGLE_PLACES_KEY` | Your Google Places API key |
| `TMDB_KEY` | Your TMDB API key |

5. Click **Deploy** — done!

---

### 4. Configure the app

Once deployed, open your Vercel URL on your phone:

1. Tap **⚙️ Settings**
2. Paste your **Firebase config JSON** and tap **Save & Connect**
3. That's it — restaurant and movie lookups work automatically, no keys needed in the app

---

## Local Development

```bash
npm install
```

Create a `.env.local` file:
```
GOOGLE_PLACES_KEY=your_key_here
TMDB_KEY=your_key_here
```

```bash
npm run dev
```

The Vite dev server proxies `/api/*` to localhost:3000, matching Vercel's production behaviour.

---

## Project Structure

```
pickt/
├── api/
│   ├── restaurants.js   # Google Places proxy (serverless)
│   ├── place-photo.js   # Google Places photo proxy (serverless)
│   └── movies.js        # TMDB proxy (serverless)
├── src/
│   ├── main.jsx
│   └── App.jsx          # Full React app
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Firebase Security Rules (recommended before going public)

In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "members": {
          "$uid": {
            ".write": "auth == null || auth.uid == $uid"
          }
        }
      }
    }
  }
}
```
