(function(){
  'use strict';
  var CC = window.CC = window.CC || {};
  var API = (CC.env && CC.env.API_BASE) || '';

  async function parseError(res){
    var text = '';
    try { text = await res.text(); } catch(_){}
    try {
      var data = text ? JSON.parse(text) : null;
      if (data && (data.detail || data.message || data.error)) return String(data.detail || data.message || data.error);
      return text || ('Erro '+res.status);
    } catch(_){ return text || ('Erro '+res.status); }
  }

  async function request(path, opts){
    opts = opts || {};
    var headers = opts.headers || {};
    var token = CC.session && CC.session.getToken && CC.session.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    var res = await fetch(API + path, { method: opts.method||'GET', headers: headers, body: opts.body });
    if (!res.ok) {
      var msg = await parseError(res);
      var err = new Error(msg); err.status = res.status; throw err;
    }
    var ct = res.headers.get('content-type') || '';
    return /json/i.test(ct) ? res.json() : res.text();
  }

  CC.api = {
    raw: request,
    me: function(){ return request('/me'); },
    login: function(email, password){
      var body = new URLSearchParams({ username: email, password: password });
      return fetch(API + '/login', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json' }, body: body })
        .then(function(r){ if(!r.ok) return parseError(r).then(function(m){ var e=new Error(m); e.status=r.status; throw e; }); return r.json(); });
    },
    register: function(payload){ return request('/register', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) }); },
    sendVerification: function(email){ return request('/auth/send-verification-code', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email: email }) }); },
    verifyAccount: function(email, code){ return request('/auth/verify-account', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email: email, code: code }) }); },
    creditsBalance: function(){ return request('/credits/balance'); },
    creditsHistory: function(){ return request('/credits/history'); },
    createOrder: function(){ return request('/payments/create-order', { method:'POST' }); }
  };
})();

