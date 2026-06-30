(function () {
  'use strict';

  // ── State ───────────────────────────────────────────────
  var leaderboard  = [];
  var isAdminMode  = false;
  var pollTimer    = null;
  var logoTaps     = 0;
  var logoTapTimer = null;

  // ── DOM refs (populated after DOMContentLoaded) ─────────
  var $tbody, $driverCount, $form, $nameInput, $timeInput,
      $submitBtn, $formMsg, $adminBar, $toastContainer;

  // ── Utilities ────────────────────────────────────────────

  function parseTimeToSeconds(str) {
    str = str.trim();
    if (str.indexOf(':') !== -1) {
      var parts = str.split(':');
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(str);
  }

  function validateTimeFormat(str) {
    // Accept M:SS.sss  or  SS.sss  (flexible, but guide toward M:SS.sss)
    return /^\d{1,2}:\d{2}\.\d{1,3}$/.test(str.trim()) ||
           /^\d{1,3}\.\d{1,3}$/.test(str.trim());
  }

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

  function showToast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    $toastContainer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2600);
  }

  function setFormMessage(msg, type) {
    $formMsg.textContent = msg;
    $formMsg.className   = 'form-message ' + (type || '');
  }

  // ── Leaderboard rendering ────────────────────────────────

  function renderLeaderboard(data) {
    leaderboard = data || [];
    if ($driverCount) {
      $driverCount.textContent = leaderboard.length + ' driver' + (leaderboard.length === 1 ? '' : 's');
    }

    if (leaderboard.length === 0) {
      $tbody.innerHTML =
        '<tr><td colspan="5"><div class="leaderboard-empty">' +
        '<span class="empty-icon">&#127937;</span>' +
        'No times yet — be the first!' +
        '</div></td></tr>';
      return;
    }

    var rows = leaderboard.map(function (entry, idx) {
      var pos     = entry.position;
      var posClass = pos === 1 ? 'pos-1' : '';
      var gapText  = formatGap(entry.gap);

      var deleteBtn = '';
      if (isAdminMode) {
        deleteBtn = '<button class="btn-delete" data-id="' + escHtml(entry.id) + '" title="Remove">&times;</button>';
      }

      return '<tr class="' + posClass + '" data-id="' + escHtml(entry.id) + '">' +
        '<td class="cell-pos"><span class="pos-number">' + pos + '</span></td>' +
        '<td class="cell-name">' + escHtml(entry.name) + '</td>' +
        '<td class="cell-time">' + escHtml(entry.timeDisplay) + '</td>' +
        '<td class="cell-gap">'  + gapText + '</td>' +
        '<td class="cell-del">'  + deleteBtn + '</td>' +
        '</tr>';
    });

    $tbody.innerHTML = rows.join('');

    // Wire delete buttons
    $tbody.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleDelete(btn.getAttribute('data-id'));
      });
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── API calls ────────────────────────────────────────────

  function apiGet(params) {
    var url = APPS_SCRIPT_URL + '?_t=' + Date.now();
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }
    }
    return fetch(url).then(function (r) { return r.json(); });
  }

  function fetchLeaderboard() {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
      return;
    }
    apiGet({ action: 'list' })
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

  // ── Form submission ───────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();

    var name = $nameInput.value.trim();
    var time = $timeInput.value.trim();

    if (!name) {
      setFormMessage('Please enter a driver name.', 'error');
      $nameInput.focus();
      return;
    }

    if (!time) {
      setFormMessage('Please enter a lap time.', 'error');
      $timeInput.focus();
      return;
    }

    if (!validateTimeFormat(time)) {
      setFormMessage('Format must be M:SS.sss  e.g. 1:23.456', 'error');
      $timeInput.focus();
      return;
    }

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
      setFormMessage('Backend not configured yet — see README.md', 'error');
      return;
    }

    $submitBtn.disabled = true;
    $submitBtn.classList.add('loading');
    $submitBtn.textContent = 'Sending...';
    setFormMessage('', '');

    apiGet({ action: 'add', name: name, timeDisplay: time })
      .then(function (data) {
        if (data.status === 'ok') {
          if (data.result === 'slower') {
            setFormMessage('Slower than existing best — not updated.', 'info');
            showToast(data.message || 'No improvement', 'info');
          } else {
            setFormMessage('Time submitted!', 'success');
            showToast(name + ' — ' + time, 'success');
            $nameInput.value = '';
            $timeInput.value = '';
          }
          renderLeaderboard(data.leaderboard);
        } else {
          setFormMessage(data.message || 'Submission failed.', 'error');
        }
      })
      .catch(function () {
        setFormMessage('Network error. Please try again.', 'error');
      })
      .finally(function () {
        $submitBtn.disabled = false;
        $submitBtn.classList.remove('loading');
        $submitBtn.textContent = 'Submit';
        setTimeout(function () { setFormMessage('', ''); }, 4000);
      });
  }

  // ── Admin mode ────────────────────────────────────────────

  function enterAdminMode() {
    var pw = prompt('Admin password:');
    if (!pw) return;

    apiGet({ action: 'delete', id: '___noop___', password: pw })
      .then(function (data) {
        if (data.message === 'Invalid password.') {
          showToast('Wrong password', 'error');
          return;
        }
        // Any other message (Entry not found, etc.) = password accepted
        isAdminMode = true;
        sessionStorage.setItem('adminMode', '1');
        $adminBar.classList.add('visible');
        renderLeaderboard(leaderboard);
        showToast('Admin mode active', '');
      })
      .catch(function () {
        showToast('Could not verify — check connection', 'error');
      });
  }

  function handleDelete(entryId) {
    if (!confirm('Remove this driver from the leaderboard?')) return;

    var pw = sessionStorage.getItem('adminPw') ||
             (function () {
               var p = prompt('Admin password:');
               if (p) sessionStorage.setItem('adminPw', p);
               return p;
             }());
    if (!pw) return;

    apiGet({ action: 'delete', id: entryId, password: pw })
      .then(function (data) {
        if (data.status === 'ok') {
          renderLeaderboard(data.leaderboard);
          showToast('Entry removed', '');
        } else {
          showToast(data.message || 'Delete failed', 'error');
          if (data.message === 'Invalid password.') {
            sessionStorage.removeItem('adminPw');
          }
        }
      })
      .catch(function () {
        showToast('Network error', 'error');
      });
  }

  // Tap logo 5× quickly to open admin prompt
  function handleLogoTap() {
    logoTaps++;
    clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(function () { logoTaps = 0; }, 1500);
    if (logoTaps >= 5) {
      logoTaps = 0;
      if (!isAdminMode) enterAdminMode();
    }
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    $tbody          = document.getElementById('lb-tbody');
    $driverCount    = document.getElementById('driver-count');
    $form           = document.getElementById('entry-form');
    $nameInput      = document.getElementById('input-name');
    $timeInput      = document.getElementById('input-time');
    $submitBtn      = document.getElementById('btn-submit');
    $formMsg        = document.getElementById('form-message');
    $adminBar       = document.getElementById('admin-bar');
    $toastContainer = document.getElementById('toast-container');

    // Restore admin session
    if (sessionStorage.getItem('adminMode') === '1') {
      isAdminMode = true;
      $adminBar.classList.add('visible');
    }

    $form.addEventListener('submit', handleSubmit);

    // Logo tap secret
    var logoEl = document.getElementById('logo-tap-target');
    if (logoEl) {
      logoEl.addEventListener('click', handleLogoTap);
      logoEl.addEventListener('touchend', function (e) {
        e.preventDefault();
        handleLogoTap();
      });
    }

    // Time input: auto-format as user types
    $timeInput.addEventListener('input', function () {
      var v = this.value.replace(/[^0-9:.]/g, '');
      this.value = v;
    });

    // Config guard
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
      renderLeaderboard([]);
      $formMsg.textContent = 'Backend not configured — see README.md';
      $formMsg.className   = 'form-message error';
      return;
    }

    startPolling();
  });

}());
