# Milhouse Fastest Lap — Setup Guide

This is a **read-only** leaderboard. Station hosts type times directly into
Google Sheets; the website just polls and displays the results. There is no
submission form and no admin/delete mode on the site.

## How it works

Your spreadsheet has 3 station tabs, each with `Name` (col A) and `Lap Time`
(col B) starting at row 2:

- `DUO STATION`
- `AMG STATION`
- `TREE STATION`

The Apps Script backend reads all 3 tabs, keeps each driver's best time
across stations, ranks them, and computes the gap to P1. The `MH Leaderboard`
tab in your spreadsheet is just for your own reference — the website does
**not** read it, so it can't get out of sync with a formula.

**If you rename a station tab or add a 4th station**, update the
`STATION_SHEETS` list at the top of `apps-script/Code.gs` and redeploy
(see "Updating the script" below).

---

## Step 1 — Deploy the Apps Script backend

You already have a spreadsheet and a Web App deployed. To pick up the new
read-only `Code.gs`:

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Select all the existing code and delete it.
3. Open `apps-script/Code.gs` from this project folder and copy the entire contents in.
4. Click **Save** (💾 or Ctrl/Cmd + S).
5. **Deploy → Manage deployments** → click the pencil (✎) on your existing deployment → **Version: New version** → **Deploy**.
   - Using "Manage deployments → Edit" keeps the same Web App URL, so you do **not** need to touch `config.js`.
   - Do NOT use "New deployment" here — that generates a new URL and breaks the live site until you update `config.js`.

---

## How to use during the event

- Each station host types `Name` / `Lap Time` (format `M:SS.sss`, e.g. `1:23.456`) directly into their station's tab in Google Sheets.
- The site polls every 5 seconds and shows each driver's best time across all 3 stations, ranked with gap-to-leader.
- No form, no login, no admin mode on the site — it's purely a display.
- The site is already live at `https://wgraczewski.github.io/milhouse-fastest-lap/`.

---

## File structure

```
Milhouse Fastest Lap/
├── index.html          — Main page
├── styles.css          — All styling
├── app.js              — Leaderboard polling + rendering
├── config.js           — Web App URL + poll interval + title
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
| "No times yet" even though the sheet has data | Check the tab names in `STATION_SHEETS` (top of `Code.gs`) exactly match your sheet's tab names |
| Times not updating after editing the sheet | Wait up to 5s for the next poll; hard-refresh if still stale |
| Google auth error on deploy | Click Advanced → proceed — it's your own script |
| Page not loading at github.io URL | Hard-refresh (Ctrl+Shift+R) |
| Duplicate driver names across stations | Names are matched case-insensitively; the fastest of the two is kept |
