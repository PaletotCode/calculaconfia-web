// Centralized, defensive routing helpers for CalculaConfia
// Purpose: avoid redirect loops and normalize platform route handling
(function(){
  'use strict';

  const STORAGE_KEY = 'cc_nav_platform_guard';

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
    if (g.attempts >= 2 && (now - g.lastAt) < 10000) return false;
    writeGuard({ attempts: (g.attempts || 0) + 1, lastAt: now });
    return true;
  }

  function redirectToPlatform(){
    try {
      if (!shouldAttempt()) return; // stop potential loops
      if (isOnPlatformHtml()) return; // already correct
      if (isOnPlatformClean()) {
        window.location.replace('/platform.html');
        return;
      }
      window.location.assign('/platform.html');
    } catch(_) {}
  }

  // Expose
  window.CCRouter = {
    isOnPlatformHtml,
    isOnPlatformClean,
    isOnPlatform,
    redirectToPlatform,
    resetGuard: clearGuard,
  };
})();

