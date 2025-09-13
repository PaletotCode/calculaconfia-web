(function(){
  'use strict';
  var TOKEN_KEY = 'cc_token';
  var RETURNING_KEY = 'cc_isReturningUser';
  var LIFETIME_KEY = 'cc_lifetime_access';
  var PAUSE_KEY = 'cc_pause_auto_platform';

  function safeGet(key){ try { return localStorage.getItem(key); } catch(_) { return null; } }
  function safeSet(key, val){ try { localStorage.setItem(key, val); } catch(_){} }
  function safeRm(key){ try { localStorage.removeItem(key); } catch(_){} }

  window.CC = window.CC || {};
  window.CC.session = {
    TOKEN_KEY: TOKEN_KEY,
    getToken: function(){ return safeGet(TOKEN_KEY); },
    setToken: function(t){ safeSet(TOKEN_KEY, t); },
    clearToken: function(){ safeRm(TOKEN_KEY); },
    setReturning: function(){ safeSet(RETURNING_KEY, 'true'); },
    isReturning: function(){ try { return !!(safeGet(TOKEN_KEY) || (localStorage.getItem(RETURNING_KEY) === 'true')); } catch(_) { return false; } },
    hasLifetime: function(){ try { return localStorage.getItem(LIFETIME_KEY) === '1'; } catch(_) { return false; } },
    setLifetime: function(){ safeSet(LIFETIME_KEY, '1'); },
    pauseAutoPlatform: function(){ try { sessionStorage.setItem(PAUSE_KEY, String(Date.now())); } catch(_){} },
    clearPause: function(){ try { sessionStorage.removeItem(PAUSE_KEY); } catch(_){} },
    isPaused: function(ttlMs){
      ttlMs = ttlMs || 300000; // 5 min default
      try { var ts = Number(sessionStorage.getItem(PAUSE_KEY)||'0'); if (!ts) return false; if (Date.now()-ts>ttlMs){ sessionStorage.removeItem(PAUSE_KEY); return false; } return true; } catch(_) { return false; }
    }
  };
})();

