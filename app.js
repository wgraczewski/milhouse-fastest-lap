(function () {
  'use strict';

  // ── State ───────────────────────────────────────────────
  var pollTimer = null;

  // ── DOM refs (populated after DOMContentLoaded) ─────────
  var $tbody, $prizeList;

  // ── Utilities ────────────────────────────────────────────

  function formatGap(gapSeconds) {
    if (gapSeconds === null) return 'LEADER';
    var s = Math.abs(gapSeconds);
    if (s >= 60) {
      var m   = Math.floor(s / 60);
      var rem = (s % 60).toFixed(3).padStart(6, '0');
      return '+' + m + ':' + rem;
    }
    return '+' + s.toFixed(3) + 's';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderPrizes() {
    if (!$prizeList || typeof PRIZES === 'undefined') return;
    $prizeList.innerHTML = PRIZES.map(function (p) {
      return '<div class="prize-item">' +
        '<span class="prize-place">' + escHtml(p.place) + '</span>' +
        '<span class="prize-name">'  + escHtml(p.prize) + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Leaderboard rendering ────────────────────────────────

  function renderLeaderboard(data) {
    var leaderboard = data || [];

    if (leaderboard.length === 0) {
      $tbody.innerHTML =
        '<tr><td colspan="4"><div class="leaderboard-empty">' +
        '<span class="empty-icon">&#127937;</span>' +
        'No times yet — be the first!' +
        '</div></td></tr>';
      return;
    }

    var rows = leaderboard.map(function (entry) {
      var pos      = entry.position;
      var posClass = pos === 1 ? 'pos-1' : '';
      var gapText  = formatGap(entry.gap);

      return '<tr class="' + posClass + '">' +
        '<td class="cell-pos"><span class="pos-number">' + pos + '</span></td>' +
        '<td class="cell-name">' + escHtml(entry.name) + '</td>' +
        '<td class="cell-time">' + escHtml(entry.timeDisplay) + '</td>' +
        '<td class="cell-gap">'  + gapText + '</td>' +
        '</tr>';
    });

    $tbody.innerHTML = rows.join('');
  }

  // ── API calls ────────────────────────────────────────────

  function fetchLeaderboard() {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
      return;
    }
    var url = APPS_SCRIPT_URL + '?_t=' + Date.now();
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.status === 'ok') {
          renderLeaderboard(data.leaderboard);
        }
      })
      .catch(function () { /* silent fail — try again next poll */ });
  }

  function startPolling() {
    fetchLeaderboard();
    pollTimer = setInterval(fetchLeaderboard, POLL_INTERVAL_MS);
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    $tbody     = document.getElementById('lb-tbody');
    $prizeList = document.getElementById('prize-list');

    renderPrizes();

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
      renderLeaderboard([]);
      return;
    }

    startPolling();
  });

}());
