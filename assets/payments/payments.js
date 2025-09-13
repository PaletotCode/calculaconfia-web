(function(){
  'use strict';

  var CC = window.CC = window.CC || {};
  var API = (CC.env && CC.env.API_BASE) || '';
  var MPK = (CC.env && CC.env.MP_PUBLIC_KEY) || '';

  function loadScript(src){
    return new Promise(function(res, rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }

  async function ensureMpSdk(){
    if (window.MercadoPago) return true;
    try { await loadScript('https://sdk.mercadopago.com/js/v2'); return !!window.MercadoPago; } catch(_) { return false; }
  }
  function getMp(){ try { if (!MPK || !window.MercadoPago) return null; return new window.MercadoPago(MPK, { locale: 'pt-BR' }); } catch(_) { return null; } }

  async function openCheckout(preferenceId, initPoint){
    var ready = await ensureMpSdk();
    var navigated = false;
    function mark(){ navigated = true; }
    try { document.addEventListener('visibilitychange', function(){ if (document.visibilityState==='hidden') mark(); }, {once:true}); window.addEventListener('pagehide', mark, {once:true}); } catch(_){ }
    if (ready && MPK){
      try {
        var mp = getMp();
        if (mp && preferenceId){
          mp.checkout({ preference: { id: preferenceId }, autoOpen: true });
          if (initPoint) setTimeout(function(){ if (!navigated) window.location.href = initPoint; }, 1200);
          return;
        }
      } catch(_){ }
    }
    if (initPoint) window.location.href = initPoint;
  }

  // ---- Pending payment state ----
  var PENDING_KEY = 'cc_pending_payment';
  function setPendingPayment(state){ try { localStorage.setItem(PENDING_KEY, JSON.stringify(state)); } catch(_){} }
  function getPendingPayment(){ try { return JSON.parse(localStorage.getItem(PENDING_KEY)||'null'); } catch(_) { return null; } }
  function clearPendingPayment(){ try { localStorage.removeItem(PENDING_KEY); } catch(_){} }

  // Helpers
  async function creditsBalance(){ try { return await CC.api.creditsBalance(); } catch(e){ if (e && e.status===401) return -1; return 0; } }

  async function pollCreditsUntilChange(base, opts){
    opts = opts || {}; var timeoutMs = opts.timeoutMs||120000, intervalMs = opts.intervalMs||2500; var start = Date.now();
    while (Date.now()-start < timeoutMs){
      var nowBal = await creditsBalance();
      if (nowBal === -1){ var err = new Error('UNAUTH'); err.code = 'UNAUTH'; throw err; }
      if (nowBal > (base||0)) return nowBal;
      await new Promise(function(r){ setTimeout(r, intervalMs); });
    }
    return null;
  }

  async function createOrder(){
    var data = await CC.api.createOrder();
    var preference_id = data.preference_id || data.id || data.preferenceId || null;
    var init_point = data.init_point || data.initPoint || data.sandbox_init_point || null;
    if (!preference_id && !init_point) throw new Error('Não foi possível criar a ordem de pagamento.');
    return { preference_id: preference_id, init_point: init_point };
  }

  // ---- Payment Card UI ----
  function showPaymentCard(message){
    var overlay = document.querySelector('#payment-card-overlay');
    var status = document.querySelector('#payment-card-status');
    if (!overlay) return;
    if (message && status){ status.textContent = message; status.classList.remove('hidden'); }
    overlay.classList.remove('hidden');
    try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch(_){ }
  }
  function hidePaymentCard(){ var overlay=document.querySelector('#payment-card-overlay'); if (overlay) overlay.classList.add('hidden'); }

  // ---- Watcher ----
  var paymentWatcherActive = false;
  async function resumePaymentWatcher(showUI){
    if (paymentWatcherActive) return;
    var pending = getPendingPayment();
    if (!pending || !(CC.session && CC.session.getToken && CC.session.getToken())) return;
    paymentWatcherActive = true;
    if (showUI) showPaymentCard('Aguardando confirmação do pagamento (PIX)...');
    try {
      var next = await pollCreditsUntilChange(pending.baseBalance||0, { timeoutMs: 180000, intervalMs: 3000 });
      if (next && next >= 1){ CC.session && CC.session.setLifetime && CC.session.setLifetime(); clearPendingPayment(); if (window.redirectToPlatform) window.redirectToPlatform(); }
    } catch(err){
      if (err && (err.code==='UNAUTH' || err.status===401)){
        showPaymentCard('Sessão expirada. Faça login para finalizar.');
        try { window.openModalPreferredView && window.openModalPreferredView(); var once=function(){ window.removeEventListener('cc:login-success', once); paymentWatcherActive=false; resumePaymentWatcher(true); }; window.addEventListener('cc:login-success', once, { once: true }); } catch(_){ }
        return;
      }
    }
    paymentWatcherActive = false;
  }

  CC.payments = {
    ensureMpSdk: ensureMpSdk,
    openCheckout: openCheckout,
    createOrder: createOrder,
    setPendingPayment: setPendingPayment,
    getPendingPayment: getPendingPayment,
    clearPendingPayment: clearPendingPayment,
    pollCreditsUntilChange: pollCreditsUntilChange,
    showPaymentCard: showPaymentCard,
    hidePaymentCard: hidePaymentCard,
    resumePaymentWatcher: resumePaymentWatcher
  };
})();

