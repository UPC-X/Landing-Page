// UPC-X landing behaviour: language (es-419 / en), mobile menu, CTA targets and contact form.
(() => {
  const STORAGE_KEY = 'upcx-lang';
  const PROTOTYPE = 'https://www.figma.com/proto/QGamFXN1K46XmRBrmCYpq9/UPC-X-Diseno-y-prototipos';
  // Figma prototype frames of the web app: W-01 Acceso and W-01b Iniciar sesión.
  const ctaTargets = {
    desktop: {
      signup: 'https://app.upcx.tech/acceso/registro',
      login: 'https://app.upcx.tech/acceso/iniciar-sesion',
    },
    mobile: {
      signup: 'https://app.upcx.tech/acceso/registro',
      login: 'https://app.upcx.tech/acceso/iniciar-sesion',
    },
  };

  const root = document.documentElement;
  const original = { text: new Map(), html: new Map(), attr: new Map() };

  // The HTML is written in Spanish; keep it so the page can switch back without a second dictionary.
  const captureSpanish = () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      original.text.set(el, el.textContent);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      original.html.set(el, el.innerHTML);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const pairs = el.dataset.i18nAttr.split(',').map((pair) => pair.split(':'));
      original.attr.set(el, pairs.map(([attr, key]) => [attr, key, el.getAttribute(attr)]));
    });
  };

  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) {
      el.setAttribute('content', value);
    }
  };

  const applyMeta = (lang) => {
    const text = messages[lang];
    const isTerms = document.body.classList.contains('terms-page');
    document.title = isTerms ? text.termsMetaTitle : text.metaTitle;
    setMeta('meta[name="description"]', text.metaDescription);
    setMeta('meta[name="keywords"]', text.metaKeywords);
    setMeta('meta[property="og:title"]', document.title);
    setMeta('meta[property="og:description"]', text.metaDescription);
    setMeta('meta[property="og:image:alt"]', text.ogImageAlt);
    setMeta('meta[property="og:locale"]', lang === 'en' ? 'en_US' : 'es_LA');
    setMeta('meta[property="og:locale:alternate"]', lang === 'en' ? 'es_LA' : 'en_US');
    setMeta('meta[name="twitter:title"]', document.title);
    setMeta('meta[name="twitter:description"]', text.metaDescription);
    setMeta('meta[name="twitter:image:alt"]', text.ogImageAlt);
  };

  const applyLanguage = (lang) => {
    const dictionary = translations[lang];
    root.lang = lang === 'en' ? 'en' : 'es-419';
    original.text.forEach((value, el) => {
      const key = el.dataset.i18n;
      el.textContent = dictionary && dictionary[key] ? dictionary[key] : value;
    });
    original.html.forEach((value, el) => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = dictionary && dictionary[key] ? dictionary[key] : value;
    });
    original.attr.forEach((pairs, el) => {
      pairs.forEach(([attr, key, value]) => {
        el.setAttribute(attr, dictionary && dictionary[key] ? dictionary[key] : value);
      });
    });
    document.querySelectorAll('[data-lang-block]').forEach((block) => {
      block.hidden = block.dataset.langBlock !== lang;
    });
    document.querySelectorAll('.lang-option').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    applyMeta(lang);
  };

  const readStoredLanguage = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  };

  const storeLanguage = (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      // Private mode or blocked storage: the choice still applies to this visit.
    }
  };

  // Priority: ?lang= in the URL, the visitor's last choice, the browser language, English.
  const resolveLanguage = () => {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'es' || param === 'en') {
      return param;
    }
    const stored = readStoredLanguage();
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
    const browser = navigator.languages || [navigator.language || ''];
    return browser.some((code) => code.toLowerCase().startsWith('es')) ? 'es' : 'en';
  };

  let currentLanguage = 'es';

  const setLanguage = (lang, remember) => {
    currentLanguage = lang;
    applyLanguage(lang);
    if (remember) {
      storeLanguage(lang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url);
    }
  };

  const setupLanguageSwitch = () => {
    document.querySelectorAll('.lang-option').forEach((button) => {
      button.addEventListener('click', () => setLanguage(button.dataset.lang, true));
    });
  };

  const setupMenu = () => {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) {
      return;
    }
    const close = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', (translations[currentLanguage] || {}).menuOpen || 'Abrir menú');
    };
    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      const text = translations[currentLanguage] || {};
      if (open) {
        toggle.setAttribute('aria-label', text.menuClose || 'Cerrar menú');
      } else {
        toggle.setAttribute('aria-label', text.menuOpen || 'Abrir menú');
      }
    });
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
  };

  // Sign-up and log-in open the matching screen of the web prototype for the visitor's screen size.
  const setupCtaTargets = () => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => {
      const targets = query.matches ? ctaTargets.mobile : ctaTargets.desktop;
      document.querySelectorAll('[data-cta="signup"]').forEach((link) => {
        link.href = targets.signup;
      });
      document.querySelectorAll('[data-cta="login"]').forEach((link) => {
        link.href = targets.login;
      });
    };
    update();
    query.addEventListener('change', update);
  };

  const setupContactForm = () => {
    const form = document.querySelector('.contact-form');
    if (!form) {
      return;
    }
    const email = form.elements.email;
    const subject = form.elements.subject;
    const message = form.elements.message;
    const status = form.querySelector('.form-status');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const button = form.querySelector('button[type="submit"]');
    let submitting = false;
    let retryAt = 0;

    const showError = (field, text) => {
      const error = document.getElementById(`${field.id}-error`);
      field.setAttribute('aria-invalid', text ? 'true' : 'false');
      error.textContent = text;
      error.hidden = !text;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting || Date.now() < retryAt) return;
      const text = messages[currentLanguage];
      const emailValue = email.value.trim();
      const messageValue = message.value.trim();
      const subjectValue = subject.value.trim();
      let emailError = '';
      if (!emailValue) {
        emailError = text.errEmailEmpty;
      } else if (!emailPattern.test(emailValue) || emailValue.length > 254) {
        emailError = text.errEmailInvalid;
      }
      const subjectError = !subjectValue || subjectValue.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(subjectValue) ? text.errSubject : '';
      const messageError = !messageValue || messageValue.length > 2000 ? text.errMessageEmpty : '';
      showError(email, emailError);
      showError(subject, subjectError);
      showError(message, messageError);
      status.hidden = false;
      if (emailError || subjectError || messageError) {
        status.textContent = text.formMissing;
        status.classList.add('is-error');
        (emailError ? email : subjectError ? subject : message).focus();
        return;
      }
      status.classList.remove('is-error');
      status.textContent = text.formSending;
      submitting = true;
      button.disabled = true;
      email.disabled = subject.disabled = message.disabled = true;
      try {
        const receipt = await window.UPCXSupport.submit({ email: emailValue, subject: subjectValue, body: messageValue }, currentLanguage);
        status.textContent = messages[currentLanguage].formSent.replace('{id}', receipt.id);
        form.reset();
      } catch (error) {
        const current = messages[currentLanguage];
        status.classList.add('is-error');
        status.textContent = current.formFailed;
        if (error.retryAfter) {
          retryAt = Date.now() + error.retryAfter * 1000;
          status.textContent += ' ' + current.formRetry.replace('{seconds}', error.retryAfter);
          setTimeout(() => { if (!submitting) button.disabled = false; }, error.retryAfter * 1000);
        }
        if (error.requestId) status.textContent += ' ' + current.requestId + ': ' + error.requestId;
      } finally {
        submitting = false;
        email.disabled = subject.disabled = message.disabled = false;
        button.disabled = Date.now() < retryAt;
      }
    });
  };

  // The terms page has one article per language; keep footer links such as #privacidad working in English.
  const syncTermsAnchor = () => {
    const anchors = { terminos: 'terms', privacidad: 'privacy', normas: 'guidelines' };
    const hash = window.location.hash.slice(1);
    const english = anchors[hash];
    const spanish = Object.keys(anchors).find((key) => anchors[key] === hash);
    const target = currentLanguage === 'en' ? english : spanish;
    if (target) {
      document.getElementById(target).scrollIntoView();
    }
  };

  captureSpanish();
  setLanguage(resolveLanguage(), false);
  if (document.body.classList.contains('terms-page')) {
    syncTermsAnchor();
  }
  setupLanguageSwitch();
  setupMenu();
  setupCtaTargets();
  setupContactForm();
})();
