// ============================================================
//  Milhouse Fastest Lap — Google Apps Script Backend
//  Paste this entire file into your Script Editor, then
//  deploy as a Web App (see README.md for instructions).
// ============================================================

var SHEET_NAME      = 'Leaderboard';
var ADMIN_PASSWORD  = 'MH99';

// ── Column indices (1-based) ──────────────────────────────
var COL_ID          = 1;
var COL_NAME        = 2;
var COL_SECONDS     = 3;
var COL_DISPLAY     = 4;
var COL_TIMESTAMP   = 5;

// ── Helpers ───────────────────────────────────────────────

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Name', 'TimeSeconds', 'TimeDisplay', 'Timestamp']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

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

function getAllEntries(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var entries = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[COL_ID - 1]) continue; // skip blank rows
    entries.push({
      id:          row[COL_ID - 1].toString(),
      name:        row[COL_NAME - 1].toString(),
      timeSeconds: parseFloat(row[COL_SECONDS - 1]),
      timeDisplay: row[COL_DISPLAY - 1].toString(),
      timestamp:   row[COL_TIMESTAMP - 1].toString(),
      rowIndex:    i + 2  // actual sheet row number
    });
  }
  return entries;
}

function buildLeaderboard(entries) {
  // Group by normalised name, keep best (lowest) time per driver
  var best = {};
  for (var i = 0; i < entries.length; i++) {
    var e   = entries[i];
    var key = e.name.trim().toLowerCase();
    if (!best[key] || e.timeSeconds < best[key].timeSeconds) {
      best[key] = e;
    }
  }
  // Sort ascending by time
  var sorted = Object.values(best).sort(function(a, b) {
    return a.timeSeconds - b.timeSeconds;
  });
  // Add gap
  var leaderTime = sorted.length > 0 ? sorted[0].timeSeconds : 0;
  for (var j = 0; j < sorted.length; j++) {
    sorted[j].gap     = j === 0 ? null : +(sorted[j].timeSeconds - leaderTime).toFixed(3);
    sorted[j].position = j + 1;
    delete sorted[j].rowIndex; // don't expose internal detail
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
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'list';

    if (action === 'list') {
      var sheet    = getSheet();
      var entries  = getAllEntries(sheet);
      var board    = buildLeaderboard(entries);
      return makeResponse({ status: 'ok', leaderboard: board });
    }

    return makeResponse({ status: 'error', message: 'Unknown action' });

  } catch (err) {
    return makeResponse({ status: 'error', message: err.toString() });
  }
}

// ── POST handler ──────────────────────────────────────────

function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var sheet  = getSheet();

    // ── Add entry ─────────────────────────────────────────
    if (action === 'add') {
      var name        = (body.name || '').toString().trim();
      var timeDisplay = (body.timeDisplay || '').toString().trim();

      if (!name || !timeDisplay) {
        return makeResponse({ status: 'error', message: 'Name and time are required.' });
      }

      var newSeconds = parseTimeToSeconds(timeDisplay);
      if (isNaN(newSeconds) || newSeconds <= 0) {
        return makeResponse({ status: 'error', message: 'Invalid time format. Use M:SS.sss' });
      }

      var entries   = getAllEntries(sheet);
      var nameLower = name.toLowerCase();

      // Check for existing entry with same name
      var existingRow = null;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].name.trim().toLowerCase() === nameLower) {
          existingRow = entries[i];
          break;
        }
      }

      if (existingRow) {
        if (newSeconds < existingRow.timeSeconds) {
          // Improvement — update the existing row
          var range = sheet.getRange(existingRow.rowIndex, 1, 1, 5);
          range.setValues([[
            existingRow.id,
            name,
            newSeconds,
            timeDisplay,
            new Date().toISOString()
          ]]);
          var updated = buildLeaderboard(getAllEntries(sheet));
          return makeResponse({ status: 'ok', result: 'updated', leaderboard: updated });
        } else {
          // Slower than personal best — ignore
          var board = buildLeaderboard(entries);
          return makeResponse({ status: 'ok', result: 'slower', message: 'A faster time already exists for ' + existingRow.name, leaderboard: board });
        }
      } else {
        // New driver — append row
        var newId = Utilities.getUuid();
        sheet.appendRow([newId, name, newSeconds, timeDisplay, new Date().toISOString()]);
        var fresh = buildLeaderboard(getAllEntries(sheet));
        return makeResponse({ status: 'ok', result: 'added', leaderboard: fresh });
      }
    }

    // ── Delete entry ──────────────────────────────────────
    if (action === 'delete') {
      if (body.password !== ADMIN_PASSWORD) {
        return makeResponse({ status: 'error', message: 'Invalid password.' });
      }

      var targetId = (body.id || '').toString().trim();
      var entries2 = getAllEntries(sheet);
      var deleted  = false;

      // Delete all rows with this id (should be one)
      // Iterate in reverse so row indices stay valid
      var toDelete = [];
      for (var k = 0; k < entries2.length; k++) {
        if (entries2[k].id === targetId) {
          toDelete.push(entries2[k].rowIndex);
        }
      }
      toDelete.sort(function(a, b) { return b - a; }); // reverse order
      for (var d = 0; d < toDelete.length; d++) {
        sheet.deleteRow(toDelete[d]);
        deleted = true;
      }

      if (!deleted) {
        return makeResponse({ status: 'error', message: 'Entry not found.' });
      }

      var finalBoard = buildLeaderboard(getAllEntries(sheet));
      return makeResponse({ status: 'ok', result: 'deleted', leaderboard: finalBoard });
    }

    return makeResponse({ status: 'error', message: 'Unknown action.' });

  } catch (err) {
    return makeResponse({ status: 'error', message: err.toString() });
  }
}
