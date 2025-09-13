(function(){
  'use strict';
  var CC = window.CC = window.CC || {};
  function init(){
    var toggle = document.getElementById('session-toggle');
    var panel = document.getElementById('session-panel');
    var statusEl = document.getElementById('session-status');
    var nameEl = document.getElementById('session-name');
    var logoutBtn = document.getElementById('session-logout');
    if (!toggle || toggle._wired) return; toggle._wired = true;
    toggle.addEventListener('click', function(){ if (panel) panel.classList.toggle('hidden'); });
    if (logoutBtn && !logoutBtn._wired) {
      logoutBtn._wired = true;
      logoutBtn.addEventListener('click', function(e){ e.preventDefault(); try { CC.session && CC.session.clearToken(); localStorage.removeItem('cc_isReturningUser'); localStorage.removeItem('cc_lifetime_access'); } catch(_){} location.replace('/'); });
    }
    // status
    if (CC.session && CC.session.getToken && CC.session.getToken()) {
      if (CC.api && CC.api.me) {
        CC.api.me().then(function(me){ var first = (me && (me.first_name || me.firstname)) || (me && me.name ? String(me.name).split(/\s+/)[0] : 'Usuário'); if (statusEl) statusEl.textContent='Logado como '+first; if (nameEl) nameEl.textContent='Você está logado como '+first; }).catch(function(){ if (statusEl) statusEl.textContent='Não logado'; });
      } else { if (statusEl) statusEl.textContent='Logado'; }
    } else { if (statusEl) statusEl.textContent='Não logado'; }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') init(); else document.addEventListener('DOMContentLoaded', init);
})();

