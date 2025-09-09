// CalculaConfia Frontend App JS
// Keeps UI identical; wires real auth flows per FRONTEND.md

(function () {
  'use strict';

  // ---- Utilities ----
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const setText = (el, msg = '') => { if (el) el.textContent = String(msg || ''); };
  const show = (el) => el && el.classList.remove('hidden');
  const hide = (el) => el && el.classList.add('hidden');
  const toggle = (el, on) => el && el.classList.toggle('hidden', !on);

  // Environment config
  const API = (window.ENV && (window.ENV.NEXT_PUBLIC_API_URL || window.ENV.NEXT_PUBLIC_API_BASE_URL))
    || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8000/api/v1'
      : 'https://calculaconfia-production.up.railway.app/api/v1');

  const TOKEN_KEY = 'cc_token';
  const RETURNING_KEY = 'cc_isReturningUser';

  const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
  };
  const setToken = (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch (_) {} };
  const setReturning = () => { try { localStorage.setItem(RETURNING_KEY, 'true'); } catch (_) {} };
  const isReturning = () => {
    try {
      if (getToken()) return true; // logged or was logged before
      return localStorage.getItem(RETURNING_KEY) === 'true';
    } catch (_) { return false; }
  };

  const headersJson = (extra = {}) => ({ 'Content-Type': 'application/json', ...extra });
  const authHeader = () => (getToken() ? { Authorization: `Bearer ${getToken()}` } : {});

  async function parseError(res) {
    const text = await res.text().catch(() => '');
    try {
      const data = text ? JSON.parse(text) : null;
      if (data && (data.detail || data.message || data.error)) return String(data.detail || data.message || data.error);
      return text || `Erro ${res.status}`;
    } catch (_) {
      return text || `Erro ${res.status}`;
    }
  }

  async function api(path, options = {}) {
    try {
      const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Accept: 'application/json',
          ...authHeader(),
        },
      });
      if (!res.ok) {
        const message = await parseError(res);
        const error = new Error(message);
        error.status = res.status;
        throw error;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return res.json();
      return res.text();
    } catch (e) {
      // Network/CORS handling
      const err = new Error('Falha de conexão (CORS/Rede). Verifique se o domínio do frontend está autorizado na API.');
      err.cause = e;
      throw err;
    }
  }

  // ---- Icons & Swiper ----
  try { if (window.lucide && lucide.createIcons) lucide.createIcons(); } catch (_) {}

  let swiper = null;
  try {
    if (window.Swiper) {
      swiper = new Swiper('.hero-carousel', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        effect: 'fade',
        fadeEffect: { crossFade: true },
      });
    }
  } catch (_) {}

  // ---- Smooth scroll for anchors ----
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return; // allow buttons we will intercept separately
      e.preventDefault();
      const targetElement = qs(targetId);
      if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ---- Section animations ----
  try {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target.id === 'comofunciona') {
          qsa('.step-card', entry.target).forEach(card => card.classList.add('is-visible'));
        }
        if (entry.target.id === 'testimonials') {
          qsa('.testimonial-grid-card', entry.target).forEach((card, index) => {
            setTimeout(() => card.classList.add('is-visible'), index * 150);
          });
        }
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    qsa('#comofunciona, #testimonials').forEach(section => scrollObserver.observe(section));
  } catch (_) {}

  // ---- Auth Modal Logic ----
  const authModalOverlay = qs('#auth-modal-overlay');
  const openAuthBtn = qs('#login-modal-btn');
  const closeAuthBtn = qs('#auth-close-btn');
  const authSpinner = qs('#auth-spinner');

  const loginView = qs('#login-view');
  const registerView = qs('#register-view');
  const forgotView = qs('#forgot-view');
  const verifyView = qs('#verify-view');

  const authTabs = qsa('.auth-tab');
  const tabLinks = qsa('[data-tab-link]');
  const forgotPasswordLink = qs('#forgot-password-link');

  const loginForm = qs('#login-form');
  const registerForm = qs('#register-form');
  const forgotForm = qs('#forgot-form');
  const verifyForm = qs('#verify-form');
  const resendCodeBtn = qs('#resend-code-btn');

  const loginError = qs('#login-error');
  const registerError = qs('#register-error');
  const forgotError = qs('#forgot-error');
  const forgotSuccess = qs('#forgot-success');
  const verifyError = qs('#verify-error');
  const verifySuccess = qs('#verify-success');

  const views = [loginView, registerView, forgotView, verifyView];

  function showView(viewToShow) {
    views.forEach(v => v && v.classList.add('hidden'));
    if (viewToShow) viewToShow.classList.remove('hidden');
    // tabs reflect only login/register
    authTabs.forEach(tab => {
      tab.classList.remove('active-tab');
      if (viewToShow && viewToShow.id.includes(tab.dataset.tab)) tab.classList.add('active-tab');
    });
    [loginError, registerError, forgotError, forgotSuccess, verifyError, verifySuccess].forEach(el => setText(el, ''));
  }

  function openModalPreferredView() {
    show(authModalOverlay);
    // first-time users → register, returning users → login
    if (isReturning()) showView(loginView); else showView(registerView);
    setReturning(); // after first open, treat as returning next time
  }

  function openModalForce(view) {
    show(authModalOverlay);
    showView(view);
    setReturning();
  }

  function closeModal() { hide(authModalOverlay); }

  if (openAuthBtn) openAuthBtn.addEventListener('click', openModalPreferredView);
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeModal);
  if (authModalOverlay) authModalOverlay.addEventListener('click', (e) => { if (e.target === authModalOverlay) closeModal(); });

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const viewId = `${tab.dataset.tab}-view`;
      const view = qs(`#${viewId}`);
      showView(view);
    });
  });

  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = `${link.dataset.tabLink}-view`;
      const view = qs(`#${viewId}`);
      showView(view);
    });
  });

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView(forgotView);
    });
  }

  const showSpinner = (on) => toggle(authSpinner, on);

  // ---- Pricing CTA: Desbloquear Análise por R$5 → auth flow ----
  const pricingUnlockButtons = qsa('#preco .tilt-card a.cta-button');
  pricingUnlockButtons.forEach(btn => {
    if ((btn.getAttribute('href') || '#') === '#') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isReturning()) openModalForce(loginView); else openModalForce(registerView);
      });
    }
  });

  // ---- HTTP calls per FRONTEND.md ----
  async function httpRegister({ email, password, first_name, last_name, applied_referral_code }) {
    return api('/register', {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify({ email, password, first_name, last_name, ...(applied_referral_code ? { applied_referral_code } : {}) }),
    });
  }

  async function httpLogin({ email, password }) {
    const body = new URLSearchParams({ username: email, password });
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
      });
      if (!res.ok) {
        const msg = await parseError(res);
        const err = new Error(msg); err.status = res.status; throw err;
      }
      return res.json();
    } catch (e) {
      const err = new Error('Falha de conexão (CORS/Rede). Se estiver em localhost, habilite CORS para http://localhost:3000 ou teste no domínio de produção.');
      err.cause = e;
      throw err;
    }
  }

  async function httpSendVerificationCode(email) {
    return api('/auth/send-verification-code', {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify({ email }),
    });
  }

  async function httpVerifyAccount(email, code) {
    return api('/auth/verify-account', {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify({ email, code }),
    });
  }

  // ---- Form handlers ----
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setText(loginError, '');
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn && (submitBtn.disabled = true);
      showSpinner(true);
      try {
        const email = qs('#login-email').value.trim();
        const password = qs('#login-password').value;
        const data = await httpLogin({ email, password });
        if (data && data.access_token) setToken(data.access_token);
        closeModal();
      } catch (err) {
        const status = err && err.status;
        let msg = err && err.message ? String(err.message) : 'Falha no login.';
        if (status === 400 || status === 401) msg = 'E-mail ou senha inválidos.';
        setText(loginError, msg);
      } finally {
        showSpinner(false);
        submitBtn && (submitBtn.disabled = false);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setText(registerError, '');
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn && (submitBtn.disabled = true);

      const password = qs('#register-password').value;
      const passwordConfirm = qs('#register-password-confirm').value;
      if (password !== passwordConfirm) { setText(registerError, 'As senhas não coincidem.'); submitBtn && (submitBtn.disabled = false); return; }
      // At least 6 chars, upper+lower letters
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\d]{6,}$/;
      if (!passwordRegex.test(password)) {
        setText(registerError, 'A senha deve ter no mínimo 6 caracteres, com letras maiúsculas e minúsculas.');
        submitBtn && (submitBtn.disabled = false);
        return;
      }

      showSpinner(true);
      try {
        const payload = {
          first_name: qs('#register-firstname').value.trim(),
          last_name: qs('#register-lastname').value.trim(),
          email: qs('#register-email').value.trim(),
          password,
        };
        await httpRegister(payload);
        // Somente mostra a tela de verificação se o envio do e-mail for bem-sucedido
        try {
          await httpSendVerificationCode(payload.email);
          const vEmail = qs('#verify-email'); if (vEmail) vEmail.value = payload.email;
          showView(verifyView);
        } catch (err) {
          setText(registerError, 'Cadastro criado, mas não foi possível enviar o código de verificação. Tente reenviar mais tarde.');
        }
      } catch (err) {
        const status = err && err.status;
        let msg = err && err.message ? String(err.message) : 'Falha no cadastro.';
        if (status === 409) msg = 'E-mail já cadastrado.';
        setText(registerError, msg);
      } finally {
        showSpinner(false);
        submitBtn && (submitBtn.disabled = false);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setText(forgotError, '');
      setText(forgotSuccess, '');
      showSpinner(true);
      try {
        // Placeholder UX: backend endpoints not specified in current scope
        await new Promise(r => setTimeout(r, 800));
        setText(forgotSuccess, 'Se o e-mail estiver cadastrado, um link foi enviado.');
        forgotForm.reset();
      } finally {
        showSpinner(false);
      }
    });
  }

  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setText(verifyError, '');
      setText(verifySuccess, '');
      const submitBtn = verifyForm.querySelector('button[type="submit"]');
      submitBtn && (submitBtn.disabled = true);
      showSpinner(true);
      try {
        const email = qs('#verify-email').value.trim();
        const code = qs('#verify-code').value.trim();
        await httpVerifyAccount(email, code);
        setText(verifySuccess, 'Conta verificada com sucesso! Faça login para continuar.');
        // Prefill login email then show login
        const loginEmail = qs('#login-email'); if (loginEmail) loginEmail.value = email;
        showView(loginView);
      } catch (err) {
        const status = err && err.status;
        let msg = err && err.message ? String(err.message) : 'Falha ao verificar conta.';
        if (status === 400 || status === 422) msg = 'Código inválido ou expirado.';
        setText(verifyError, msg);
      } finally {
        showSpinner(false);
        submitBtn && (submitBtn.disabled = false);
      }
    });
  }

  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async () => {
      setText(verifyError, '');
      setText(verifySuccess, '');
      const email = (qs('#verify-email')?.value || '').trim();
      if (!email) { setText(verifyError, 'Informe seu e-mail.'); return; }
      showSpinner(true);
      try {
        await httpSendVerificationCode(email);
        setText(verifySuccess, 'Código reenviado! Verifique sua caixa de entrada.');
      } catch (err) {
        setText(verifyError, err && err.message ? String(err.message) : 'Falha ao reenviar código.');
      } finally {
        showSpinner(false);
      }
    });
  }

  // ---- Visual effects kept unchanged ----
  try {
    const initVanta = () => {
      if (!window.VANTA) return;
      window.VANTA.NET({ el: '#comofunciona', mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200.00, minWidth: 200.00, scale: 1.00, scaleMobile: 1.00, color: 0xcccccc, backgroundColor: 0xffffff, points: 11.00, maxDistance: 22.00, spacing: 18.00 });
      window.VANTA.NET({ el: '#testimonials', mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200.00, minWidth: 200.00, scale: 1.00, scaleMobile: 1.00, color: 0xcccccc, backgroundColor: 0xffffff, points: 11.00, maxDistance: 22.00, spacing: 18.00 });
    };
    setTimeout(initVanta, 500);
  } catch (_) {}

  try {
    const heroText = qs('#hero-text-content');
    if (heroText) {
      window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        if (scrollPosition < window.innerHeight) {
          heroText.style.transform = `translateY(${scrollPosition * 0.5}px)`;
          heroText.style.opacity = String(1 - (scrollPosition / (window.innerHeight / 1.5)));
        }
      });
    }
  } catch (_) {}

  try {
    if (window.VanillaTilt) {
      VanillaTilt.init(qsa('.tilt-card'), { max: 15, speed: 400, glare: true, 'max-glare': 0.5, scale: 1.05 });
    }
  } catch (_) {}

  try {
    const pricingDetails = qs('#pricing-details');
    const pricingDetailsToggle = qs('#pricing-details-toggle');
    if (pricingDetails && pricingDetailsToggle) {
      pricingDetailsToggle.addEventListener('click', () => {
        const icon = pricingDetailsToggle.querySelector('i');
        if (pricingDetails.style.maxHeight) {
          pricingDetails.style.maxHeight = null;
          const span = pricingDetailsToggle.querySelector('span'); if (span) span.textContent = 'Entenda o porquê';
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          pricingDetails.style.maxHeight = pricingDetails.scrollHeight + 'px';
          const span = pricingDetailsToggle.querySelector('span'); if (span) span.textContent = 'Mostrar menos';
          if (icon) icon.style.transform = 'rotate(180deg)';
        }
      });
    }
  } catch (_) {}

  try {
    qsa('.spotlight-section').forEach(section => {
      section.addEventListener('mousemove', e => {
        const rect = section.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        section.style.setProperty('--x', `${x}px`);
        section.style.setProperty('--y', `${y}px`);
      });
    });
  } catch (_) {}

  try {
    const heroCarouselElement = qs('.hero-carousel');
    if (heroCarouselElement) {
      const autoplayObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!swiper || !swiper.autoplay) return;
          if (entry.isIntersecting) swiper.autoplay.start(); else swiper.autoplay.stop();
        });
      }, { threshold: 0 });
      autoplayObserver.observe(heroCarouselElement);
    }
  } catch (_) {}
})();
