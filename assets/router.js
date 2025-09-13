// Centralized, defensive routing helpers for CalculaConfia
// Purpose: avoid redirect loops and normalize platform route handling
(function(){
  'use strict';

  const STORAGE_KEY = 'cc_nav_platform_guard';
  const DEBUG_KEY = 'cc_debug_router';

  function now(){ return new Date().toISOString(); }
  function isDebug(){
    try {
      if (typeof window.CC_DEBUG === 'boolean') return !!window.CC_DEBUG;
      const fromLs = (localStorage.getItem(DEBUG_KEY) || sessionStorage.getItem(DEBUG_KEY) || '').toString().toLowerCase();
      return fromLs === '1' || fromLs === 'true';
    } catch(_) { return false; }
  }
  function setDebug(on){
    try { localStorage.setItem(DEBUG_KEY, on ? '1' : '0'); } catch(_){}
    try { sessionStorage.setItem(DEBUG_KEY, on ? '1' : '0'); } catch(_){}
  }
  function log(event, data){
    try {
      window.__cc_logs = window.__cc_logs || [];
      const payload = { ts: now(), scope: 'router', event, data };
      window.__cc_logs.push(payload);
      if (isDebug() && console && console.info) console.info('[CC][router]', event, data || '');
    } catch(_){}
  }

  function readGuard(){
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch(_) { return null; }
  }
  function writeGuard(obj){
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch(_){}
  }
  function clearGuard(){
    try { sessionStorage.removeItem(STORAGE_KEY); } catch(_){}
  }

  function cleanPath(){
    try { return location.pathname.replace(/\/+$/, ''); } catch(_) { return ''; }
  }

  function isOnPlatformHtml(){
    try { return /\/platform\.html$/.test(cleanPath()); } catch(_) { return false; }
  }
  function isOnPlatformClean(){
    try { return /\/platform$/.test(cleanPath()); } catch(_) { return false; }
  }
  function isOnPlatform(){
    return isOnPlatformHtml() || isOnPlatformClean();
  }

  // Hard guard against infinite refresh loops across misconfigured rewrites
  // Allows at most 2 redirect attempts within 10s
  function shouldAttempt(){
    const now = Date.now();
    const g = readGuard() || { attempts: 0, lastAt: 0 };
    if (g.attempts >= 2 && (now - g.lastAt) < 10000) { log('guard:block', g); return false; }
    writeGuard({ attempts: (g.attempts || 0) + 1, lastAt: now });
    log('guard:attempt', { attempts: (g.attempts || 0) + 1 });
    return true;
  }

  function redirectToPlatform(){
    try {
      log('redirect:called', { path: cleanPath(), onHtml: isOnPlatformHtml(), onClean: isOnPlatformClean() });
      if (!shouldAttempt()) return; // stop potential loops
      if (isOnPlatformHtml()) { log('redirect:noop_already_on_html'); return; }
      if (isOnPlatformClean()) {
        log('redirect:normalize_clean_to_html');
        window.location.replace('/platform.html');
        return;
      }
      log('redirect:assign_to_html');
      window.location.assign('/platform.html');
    } catch(_) {}
  }

  // Expose
  window.CCRouter = {
    setDebug,
    isDebug,
    log,
    isOnPlatformHtml,
    isOnPlatformClean,
    isOnPlatform,
    redirectToPlatform,
    resetGuard: clearGuard,
    _dbg: { readGuard, writeGuard, clearGuard, shouldAttempt, cleanPath },
  };

  // Initial debug banner
  log('init', { path: cleanPath(), userAgent: navigator.userAgent });
})();
