/* ============================================================
   FITCORE TECHNICAL SERVICES — site behaviour
   Works in two modes:
     · single-file build  → hash router over .page sections
     · multi-page build   → normal links, router stays asleep
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Sticky header + scroll progress ---------- */
  var header   = $('.header');
  var progress = $('.progress');

  var onScroll = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 40);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---------- Mobile drawer ---------- */
  var burger = $('.burger');
  var drawer = $('.drawer');
  var setDrawer = function (open) {
    if (!burger || !drawer) return;
    burger.classList.toggle('is-open', open);
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false);
    });
  }

  /* ---------- Reveal + counters (re-bindable per page) ---------- */
  var revealIO = null, countIO = null;

  if ('IntersectionObserver' in window && !reduceMotion) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var start = null, dur = 1300;
        var tick = function (ts) {
          if (!start) start = ts;
          var pr = Math.min((ts - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - pr, 3))).toString();
          if (pr < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.45 });
  }

  var bindMotion = function (scope) {
    var root = scope || document;
    if (!revealIO) {
      $$('.reveal', root).forEach(function (el) { el.classList.add('is-in'); });
      $$('[data-count]', root).forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    $$('.reveal', root).forEach(function (el) {
      el.classList.remove('is-in');
      revealIO.observe(el);
    });
    $$('[data-count]', root).forEach(function (el) {
      el.textContent = '0';
      countIO.observe(el);
    });
  };

  /* ---------- Router ---------- */
  var pages = $$('.page');
  var isSPA = pages.length > 0;

  var setActiveLinks = function (key) {
    $$('.nav a, .drawer a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var match = isSPA
        ? href.replace(/^#/, '').split(':')[0] === key
        : href.split('/').pop().split('#')[0] === key;
      a.classList.toggle('is-active', match);
    });
  };

  var openAccordion = function (id) {
    var item = document.getElementById(id);
    if (!item || !item.classList.contains('acc__item')) return;
    var btn = $('.acc__btn', item);
    if (btn && !item.classList.contains('is-open')) btn.click();
    setTimeout(function () {
      item.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 140);
  };

  var go = function (raw) {
    if (!isSPA) return;
    var parts = (raw || '').replace(/^#/, '').split(':');
    var key = parts[0] || 'home';
    var sub = parts[1];

    var target = document.getElementById(key);
    if (!target || !target.classList.contains('page')) {
      key = 'home';
      target = document.getElementById('home');
    }
    if (!target) return;

    pages.forEach(function (p) { p.classList.toggle('is-active', p === target); });
    setActiveLinks(key);
    var t = target.getAttribute('data-title');
    if (t) document.title = t;

    window.scrollTo(0, 0);
    bindMotion(target);
    if (sub) openAccordion(sub);
  };

  if (isSPA) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('project')) return;
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      setDrawer(false);
      if (location.hash !== href) {
        history.pushState(null, '', href);
        go(href);
      } else {
        go(href);
      }
    });
    window.addEventListener('popstate', function () { go(location.hash); });
    go(location.hash || '#home');
  } else {
    setActiveLinks(location.pathname.split('/').pop() || 'index.html');
    bindMotion(document);
  }

  /* ---------- Hero slideshow ---------- */
  var slides = $$('.hero__slide');
  if (slides.length > 1) {
    var dotsHost = $('.hero__dots');
    var nowEl    = $('[data-slide-now]');
    var totalEl  = $('[data-slide-total]');
    var slideIx  = 0;
    var timer    = null;
    var DURATION = 6000;

    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    if (totalEl) totalEl.textContent = pad(slides.length);

    var dots = [];
    if (dotsHost) {
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'hero__dot' + (i === 0 ? ' is-active' : '');
        d.type = 'button';
        d.setAttribute('aria-label', 'Show image ' + (i + 1));
        d.addEventListener('click', function () { paint(i); restart(); });
        dotsHost.appendChild(d);
        dots.push(d);
      });
    }

    function paint(i) {
      slideIx = (i + slides.length) % slides.length;
      slides.forEach(function (sl, n) {
        sl.classList.toggle('is-active', n === slideIx);
      });
      dots.forEach(function (d, n) {
        // re-adding the class restarts the fill animation
        d.classList.remove('is-active');
        if (n === slideIx) { void d.offsetWidth; d.classList.add('is-active'); }
      });
      if (nowEl) nowEl.textContent = pad(slideIx + 1);
    }

    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(function () { paint(slideIx + 1); }, DURATION);
    }

    if (!reduceMotion) {
      restart();
      // don't burn cycles while the tab is hidden
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) clearInterval(timer); else restart();
      });
    }
  }

  /* ---------- Project filters ---------- */
  var filterBar = $('.filters');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      $$('.filter', filterBar).forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var cat = btn.getAttribute('data-filter');
      $$('.project').forEach(function (card) {
        card.classList.toggle('is-hidden', !(cat === 'all' || card.getAttribute('data-cat') === cat));
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = $('.lightbox');
  if (lightbox) {
    var lbImg   = $('.lightbox figure img', lightbox);
    var lbTitle = $('[data-lb-title]', lightbox);
    var lbMeta  = $('[data-lb-meta]', lightbox);
    var lbLink  = $('[data-lb-link]', lightbox);
    var cards = [], index = 0, lastFocus = null;

    var refresh = function () {
      cards = $$('.project').filter(function (c) {
        return !c.classList.contains('is-hidden') && c.offsetParent !== null;
      });
    };

    var show = function (i) {
      if (!cards.length) return;
      index = (i + cards.length) % cards.length;
      var card = cards[index];
      var img = $('img', card);
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt;
      if (lbTitle) lbTitle.innerHTML = card.getAttribute('data-title') || '';
      if (lbMeta)  lbMeta.innerHTML  = card.getAttribute('data-meta') || '';
      if (lbLink) {
        var url = card.getAttribute('data-link');
        if (url) { lbLink.href = url; lbLink.style.display = ''; }
        else { lbLink.style.display = 'none'; }
      }
    };

    var close = function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    document.addEventListener('click', function (e) {
      var card = e.target.closest('.project');
      if (!card) return;
      e.preventDefault();
      refresh();
      lastFocus = document.activeElement;
      show(cards.indexOf(card));
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.lightbox__close', lightbox).focus();
    });

    $('.lightbox__close', lightbox).addEventListener('click', close);
    $('.lightbox__nav.prev', lightbox).addEventListener('click', function () { show(index - 1); });
    $('.lightbox__nav.next', lightbox).addEventListener('click', function () { show(index + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------- Accordion ---------- */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item  = btn.closest('.acc__item');
      var panel = $('.acc__panel', item);
      var wasOpen = item.classList.contains('is-open');

      $$('.acc__item.is-open').forEach(function (other) {
        other.classList.remove('is-open');
        $('.acc__panel', other).style.maxHeight = null;
        $('.acc__btn', other).setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  window.addEventListener('resize', function () {
    $$('.acc__item.is-open .acc__panel').forEach(function (panel) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  /* ---------- Contact form ---------- */
  var form = $('.form');
  if (form) {
    var status = $('.form__status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var value = input.value.trim();
        var bad = !value;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        if (!bad && input.type === 'tel')   bad = value.replace(/\D/g, '').length < 7;
        field.classList.toggle('has-error', bad);
        if (bad && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      if (status) {
        status.textContent = 'Thanks — your enquiry is ready to send. Connect this form to your mail service to receive it.';
        status.classList.add('is-visible');
      }
      form.reset();
    });
    $$('input, select, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('has-error');
      });
    });
  }

  /* ---------- Remote image fallback ---------- */
  $$('img[data-remote]').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.classList.add('img-fallback');
    });
  });

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

})();
