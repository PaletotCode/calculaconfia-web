// Centralized, defensive routing helpers for CalculaConfia
// Purpose: avoid redirect loops and normalize platform route handling
(function(){
  'use strict';

  const STORAGE_KEY = 'cc_nav_platform_guard';
  const DEBUG_KEY = 'cc_debug_router';
  const DOM_GUARD_KEY = 'cc_platform_dom_loaded';

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

  function hasPlatformDom(){
    try { return !!(document.querySelector('#page-container') || document.querySelector('#calculate-container')); } catch(_) { return false; }
  }

  async function ensurePlatformDom(){
    try {
      if (!isOnPlatform()) return;
      if (hasPlatformDom()) { log('platform_dom:present'); return; }
      log('platform_dom:missing');
      const guard = sessionStorage.getItem(DOM_GUARD_KEY);
      if (guard === '1') { log('platform_dom:guard_block'); return; }
      sessionStorage.setItem(DOM_GUARD_KEY, '1');

      const res = await fetch('/platform.html', { cache: 'no-store' });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (doc.title) document.title = doc.title;
      const body = doc.body; if (!body) throw new Error('no-body');
      document.body.innerHTML = body.innerHTML;
      // re-exec scripts
      const scripts = Array.from(document.body.querySelectorAll('script'));
      for (const s of scripts) {
        const n = document.createElement('script');
        if (s.src) { n.src = s.getAttribute('src'); n.defer = s.defer; n.async = s.async; }
        else { n.text = s.textContent || ''; }
        const t = s.getAttribute('type'); if (t) n.setAttribute('type', t);
        document.body.appendChild(n);
      }
      log('platform_dom:mounted');
    } catch(e) {
      log('platform_dom:error', { message: String(e && e.message || e) });
    }
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
      // Prefer the clean path now that we have /platform/index.html
      if (isOnPlatformHtml() || isOnPlatformClean()) { log('redirect:noop_already_on_platform'); try { ensurePlatformDom(); } catch(_){} return; }
      if (!shouldAttempt()) return; // stop potential loops
      log('redirect:assign_to_clean');
      window.location.assign('/platform');
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
    ensurePlatformDom,
    _dbg: { readGuard, writeGuard, clearGuard, shouldAttempt, cleanPath },
  };

  // Initial debug banner
  log('init', { path: cleanPath(), userAgent: navigator.userAgent });
  // If page loads at /platform due to rewrites but without platform DOM, attempt mount
  try { if (isOnPlatform()) ensurePlatformDom(); } catch(_){}
})();
