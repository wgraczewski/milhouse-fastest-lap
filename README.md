# Milhouse Fastest Lap — Setup Guide

Follow these four steps once before the event. Takes about 10 minutes total.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Rename it to **"Milhouse Fastest Lap"** (click the title at the top).
3. Leave the first sheet blank — the script will set up the columns automatically.

---

## Step 2 — Add the Apps Script backend

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete all the starter code in the editor.
3. Open the file `apps-script/Code.gs` from this project folder and **copy the entire contents**.
4. Paste it into the Apps Script editor.
5. Click **Save** (💾 icon or Ctrl/Cmd + S).

---

## Step 3 — Deploy the script as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon ⚙ next to "Type" and choose **Web app**.
3. Fill in the settings:
   - **Description:** Milhouse Fastest Lap
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. If prompted, click **Authorize access** and follow the Google sign-in prompts (you may see a "This app isn't verified" warning — click **Advanced → Go to Milhouse Fastest Lap (unsafe)** — this is your own script, it's fine).
6. After deployment, you'll see a **Web app URL** that looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **Copy this URL** — you'll need it in Step 4.

> **Important:** Any time you change Code.gs you must create a *new deployment* (Deploy → New deployment), not just save. The URL stays the same for updates if you use "Manage deployments → Edit."

---

## Step 4 — Wire up the URL and deploy to GitHub Pages

### 4a — Paste the URL into config.js

Open `config.js` and replace the placeholder:

```js
// BEFORE
var APPS_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';

// AFTER (use your actual URL)
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

You can also change the event title here:
```js
var EVENT_TITLE = 'Fastest Lap Challenge';
```

### 4b — Push to GitHub and enable Pages

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Click **+** → **New repository**. Name it `milhouse-fastest-lap`. Keep it **Public**. Click **Create repository**.
3. On your Mac, open Terminal, navigate to this folder, and run:

```bash
cd "/Users/wgraczewski/Desktop/Milhouse Fastest Lap"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/milhouse-fastest-lap.git
git push -u origin main
```
*(replace `YOUR_USERNAME` with your GitHub username)*

4. On GitHub, go to your repo → **Settings → Pages**.
5. Under **Source**, choose **Deploy from a branch → main → / (root)** → Save.
6. After ~60 seconds, your site is live at:
   ```
   https://YOUR_USERNAME.github.io/milhouse-fastest-lap/
   ```
   Share this URL with everyone before the event!

---

## How to use during the event

**Submitting a time:**
- Open the URL on any phone/browser.
- Enter driver name and lap time in `M:SS.sss` format (e.g. `1:23.456`).
- Hit Submit — the leaderboard updates in real time for everyone.
- If a driver submits a new time, only their **fastest** time is kept.

**Admin mode (deleting entries):**
- On any device, **tap the logos in the header 5 times quickly**.
- Enter the admin password: `MH99`
- Red ✕ buttons appear next to each driver — tap to remove them.
- Admin mode stays active for the browser session.

**Leaderboard auto-refreshes every 5 seconds.**

---

## File structure

```
Milhouse Fastest Lap/
├── index.html          — Main page
├── styles.css          — All styling
├── app.js              — Leaderboard logic, form, admin
├── config.js           — ← Edit this: paste Web App URL here
├── assets/
│   ├── logo-gold.png       — GT shield mark
│   └── logo-wordmark.png   — Milhouse wordmark (white)
└── apps-script/
    └── Code.gs         — Paste this into Google Apps Script
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Backend not configured" message | Paste your Web App URL into `config.js` and push to GitHub |
| Times not showing after submit | Check that the Web App is deployed with "Anyone" access |
| Google auth error on deploy | Click Advanced → proceed — it's your own script |
| Page not loading at github.io URL | Wait 1–2 min after enabling Pages; hard-refresh (Ctrl+Shift+R) |
| Duplicate driver names | Names are matched case-insensitively — make sure spelling is consistent |
