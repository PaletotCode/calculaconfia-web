(function(){
  'use strict';
  function openLogin(){ try { if (window.openModalForce && document.getElementById('login-view')) openModalForce(document.getElementById('login-view')); } catch(_){} }
  function openRegister(){ try { if (window.openModalForce && document.getElementById('register-view')) openModalForce(document.getElementById('register-view')); } catch(_){} }
  document.addEventListener('click', function(evt){
    var el = evt.target.closest('#open-login-btn');
    if (el) { evt.preventDefault(); openLogin(); }
    var unlock = evt.target.closest('#unlock-cta');
    if (unlock) { evt.preventDefault(); openRegister(); }
  }, true);
})();

