// ── CONFIGURATION ─────────────────────────────────────────
// After deploying your Apps Script Web App, paste the URL below.
// See README.md for step-by-step instructions.

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwiN9I3DermIKU0h-3KD0o2jYWeoCPFdsZHEV5eAAs0K-VlVGxQA3CRYab74E_8psvBDQ/exec';

// How often (in milliseconds) the leaderboard auto-refreshes.
var POLL_INTERVAL_MS = 2000; // 2 seconds

// Event title shown on the page
var EVENT_TITLE = 'Fastest Lap Challenge';

// Prizes shown in the sidebar (in display order)
var PRIZES = [
  { place: '1st Place', prize: 'Logitech Playseat Trophy and Logitech Wheel and Pedal Set' },
  { place: '2nd Place', prize: 'Milhouse Marble Headset Stand with Wireless Headset' },
  { place: '3rd Place', prize: 'Professional Gaming Tee and Cap' }
];
