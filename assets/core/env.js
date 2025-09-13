(function(){
  'use strict';
  function readEnv(){
    try {
      var el = document.getElementById('env-config');
      if (el && el.textContent) return JSON.parse(el.textContent);
    } catch(_){}
    return (window.ENV || {});
  }
  var ENV = readEnv();
  var API = (ENV.NEXT_PUBLIC_API_URL || ENV.NEXT_PUBLIC_API_BASE_URL)
    || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:8000/api/v1'
      : 'https://calculaconfia-production.up.railway.app/api/v1');
  var MP_PUBLIC_KEY = ENV.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';
  window.CC = window.CC || {};
  window.CC.env = {
    raw: ENV,
    API_BASE: API,
    MP_PUBLIC_KEY: MP_PUBLIC_KEY,
    get: function(k){ return ENV[k]; }
  };
})();

