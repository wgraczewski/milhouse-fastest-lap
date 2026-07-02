// ============================================================
//  Milhouse Fastest Lap — Google Apps Script Backend
//  Read-only leaderboard aggregated from the station tabs.
//  Paste this entire file into your Script Editor, then
//  deploy as a Web App (see README.md for instructions).
// ============================================================

var STATION_SHEETS = ['DUO STATION', 'AMG STATION', 'TREE STATION'];

// ── Helpers ───────────────────────────────────────────────

function parseTimeToSeconds(timeStr) {
  // Accepts "M:SS.sss" or "SS.sss"
  timeStr = timeStr.toString().trim();
  if (timeStr.indexOf(':') !== -1) {
    var parts = timeStr.split(':');
    var mins  = parseInt(parts[0], 10);
    var secs  = parseFloat(parts[1]);
    return mins * 60 + secs;
  }
  return parseFloat(timeStr);
}

function getStationEntries(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var entries = [];
  for (var i = 0; i < data.length; i++) {
    var name = data[i][0] ? data[i][0].toString().trim() : '';
    var timeDisplay = data[i][1] ? data[i][1].toString().trim() : '';
    if (!name || !timeDisplay) continue;

    var timeSeconds = parseTimeToSeconds(timeDisplay);
    if (isNaN(timeSeconds) || timeSeconds <= 0) continue;

    entries.push({ name: name, timeSeconds: timeSeconds, timeDisplay: timeDisplay });
  }
  return entries;
}

function buildLeaderboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var all = [];
  for (var s = 0; s < STATION_SHEETS.length; s++) {
    all = all.concat(getStationEntries(ss, STATION_SHEETS[s]));
  }

  // Group by normalised name, keep best (lowest) time per driver
  var best = {};
  for (var i = 0; i < all.length; i++) {
    var e   = all[i];
    var key = e.name.toLowerCase();
    if (!best[key] || e.timeSeconds < best[key].timeSeconds) {
      best[key] = e;
    }
  }

  // Sort ascending by time
  var sorted = Object.values(best).sort(function (a, b) {
    return a.timeSeconds - b.timeSeconds;
  });

  // Add position + gap
  var leaderTime = sorted.length > 0 ? sorted[0].timeSeconds : 0;
  for (var j = 0; j < sorted.length; j++) {
    sorted[j].position = j + 1;
    sorted[j].gap = j === 0 ? null : +(sorted[j].timeSeconds - leaderTime).toFixed(3);
  }
  return sorted;
}

function makeResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── GET handler ───────────────────────────────────────────

function doGet(e) {
  try {
    return makeResponse({ status: 'ok', leaderboard: buildLeaderboard() });
  } catch (err) {
    return makeResponse({ status: 'error', message: err.toString() });
  }
}
