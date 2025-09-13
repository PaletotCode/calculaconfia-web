// CalculaConfia Centralized Router v2.1 (Fixed)
// Handles platform redirection with proper server configuration

(function () {
  'use strict';

  const VERSION = '2.1';

  // Global namespace
  window.CCRouter = window.CCRouter || {};
  const R = window.CCRouter;

  // Logs storage and debug utilities
  window.__cc_logs = window.__cc_logs || [];

  R.version = VERSION;

  // Debug utilities
  R.isDebug = function() {
    try {
      const v = (localStorage.getItem('cc_debug_router') || sessionStorage.getItem('cc_debug_router') || '').toString().toLowerCase();
      return v === '1' || v === 'true';
    } catch(_) { return false; }
  };

  R.setDebug = function(on) {
    try { localStorage.setItem('cc_debug_router', on ? '1' : '0'); } catch(_){}
    try { sessionStorage.setItem('cc_debug_router', on ? '1' : '0'); } catch(_){}
    if (console && console.info) console.info('[CC][router] debug =', !!on);
  };

  R.log = function(event, data) {
    try {
      window.__cc_logs.push({ 
        ts: new Date().toISOString(), 
        scope: 'router', 
        version: VERSION,
        event, 
        data: data || null 
      });
      if (R.isDebug() && console && console.info) {
        console.info('[CC][router]', event, data || '');
      }
    } catch(_){}
  };

  // Path utilities
  R.isOnPlatformHtml = function() {
    try {
      return /\/platform\.html(\?.*)?$/i.test(location.pathname);
    } catch(_) { return false; }
  };

  R.isOnPlatform = function() {
    try {
      const path = location.pathname.replace(/\/+$/, '');
      return /\/platform(\.html)?$/i.test(path);
    } catch(_) { return false; }
  };

  R.isOnPlatformPath = function() {
    try {
      const path = location.pathname.replace(/\/+$/, '');
      return path === '/platform' || path === '/platform.html';
    } catch(_) { return false; }
  };

  R.shouldRedirectToPlatform = function(userHasCredits) {
    if (!userHasCredits) return false;
    const path = location.pathname.replace(/\/+$/, '');
    // Redirect to platform if user is on landing page and has credits
    return path === '' || path === '/' || path === '/index.html';
  };

  // Platform DOM verification
  R.ensurePlatformDom = function() {
    try {
      if (!R.isOnPlatform()) return;
      
      const hasPlatformElements = !!(
        document.querySelector('#page-container') &&
        document.querySelector('#calculate-container') &&
        document.querySelector('.nav-container')
      );
      
      if (hasPlatformElements) {
        R.log('ensurePlatformDom:already_correct');
        return true;
      }

      R.log('ensurePlatformDom:wrong_dom_detected', {
        path: location.pathname,
        title: document.title
      });

      // Force reload to correct page
      if (location.pathname === '/platform') {
        R.log('ensurePlatformDom:force_reload_platform_html');
        location.replace('/platform.html');
        return false;
      }
      
      return false;
    } catch(error) {
      R.log('ensurePlatformDom:error', { error: error.message });
      return false;
    }
  };

  // Anti-loop protection
  let redirectCount = 0;
  const MAX_REDIRECTS = 2;
  const REDIRECT_RESET_TIME = 10000; // 10 seconds

  R.resetRedirectCount = function() {
    redirectCount = 0;
  };

  // Auto-reset redirect count periodically
  setInterval(R.resetRedirectCount, REDIRECT_RESET_TIME);

  // Main redirect function
  R.redirectToPlatform = function() {
    try {
      if (redirectCount >= MAX_REDIRECTS) {
        R.log('guard:max_redirects_reached', { count: redirectCount });
        return;
      }

      redirectCount++;
      
      const currentPath = location.pathname.replace(/\/+$/, '');
      R.log('redirect:called', { 
        path: currentPath, 
        count: redirectCount 
      });

      // If already on platform path, ensure DOM is correct
      if (R.isOnPlatform()) {
        if (R.ensurePlatformDom()) {
          R.log('redirect:noop_already_on_platform');
          return;
        }
        // ensurePlatformDom handles the redirect if needed
        return;
      }

      // Redirect to platform.html (most reliable)
      R.log('redirect:executing', { 
        from: currentPath, 
        to: '/platform.html' 
      });
      
      location.assign('/platform.html');
      
    } catch(error) {
      R.log('redirect:error', { error: error.message });
    }
  };

  // Initialize
  R.log('router:initialized', { 
    version: VERSION,
    path: location.pathname,
    isOnPlatform: R.isOnPlatform()
  });

  // Export for debugging
  if (R.isDebug()) {
    console.info('[CC][router] Router v' + VERSION + ' loaded. Use CCRouter.setDebug(false) to disable logs.');
  }

})();