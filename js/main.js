// AXIS — interactions (lenis / cursor / reveal / parallax / scrollnav / concept waves)
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  const headerH = 72;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      const btn = document.getElementById('menu-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.scrollTo(target, { offset: -headerH, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- custom cursor ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    const ring = cursor.querySelector('.cursor__ring');
    const dot = cursor.querySelector('.cursor__dot');
    let tx = -100, ty = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    const loop = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      dot.style.transform = `translate(${tx}px, ${ty}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* ---------- header state ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- reveal on scroll ---------- */
  // stagger: assign incremental delays within each .stagger group
  document.querySelectorAll('.stagger').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--d', `${Math.min(i * 0.12, 0.72)}s`);
    });
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- hero intro (anime.js) ---------- */
  if (window.anime && !reduced) {
    anime.timeline({ easing: 'easeOutExpo' })
      .add({
        targets: '.hero__title .line__in',
        translateY: ['112%', '0%'],
        duration: 1300,
        delay: anime.stagger(95, { start: 250 }),
      })
      .add({
        targets: '.hero-fade',
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 1100,
        delay: anime.stagger(110),
      }, '-=900');
  } else {
    document.querySelectorAll('.hero__title .line__in').forEach((el) => { el.style.transform = 'none'; });
    document.querySelectorAll('.hero-fade').forEach((el) => { el.style.opacity = '1'; });
  }

  /* ---------- scroll indicator ---------- */
  const sections = Array.from(document.querySelectorAll('[data-sec]'));
  const curEl = document.getElementById('scrollnav-cur');
  const fillEl = document.getElementById('scrollnav-fill');
  const onScrollNav = () => {
    const mid = window.scrollY + window.innerHeight * 0.45;
    let cur = '01';
    for (const s of sections) {
      if (s.offsetTop <= mid) cur = s.dataset.sec;
    }
    if (curEl && curEl.textContent !== cur) curEl.textContent = cur;
    if (fillEl) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fillEl.style.height = `${(window.scrollY / Math.max(max, 1)) * 100}%`;
    }
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- parallax ---------- */
  const prlxEls = Array.from(document.querySelectorAll('[data-prlx]')).map((el) => ({
    el, f: parseFloat(el.dataset.prlx) || 0.05,
  }));
  if (prlxEls.length && !reduced) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      prlxEls.forEach(({ el, f }) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * f;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.06)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 02 concept: wave field canvas ---------- */
  const cv = document.getElementById('concept-canvas');
  if (cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, visible = true, t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);

    const LINES = 26, STEP = 8;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < LINES; i++) {
        const yBase = h * 0.28 + (i / LINES) * h * 0.62;
        const alpha = 0.03 + 0.10 * Math.sin((i / LINES) * Math.PI);
        ctx.strokeStyle = `rgba(226,232,238,${alpha.toFixed(3)})`;
        ctx.beginPath();
        for (let x = 0; x <= w; x += STEP) {
          const u = x / w;
          // amplitude envelope: peaks right of center, calm at edges
          const env = Math.exp(-Math.pow((u - 0.62) * 3.0, 2));
          const y = yBase
            + Math.sin(u * 7 + t * 0.7 + i * 0.32) * 24 * env
            + Math.sin(u * 17 - t * 0.45 + i * 0.18) * 9 * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    if (reduced) { t = 5; draw(); }
    else {
      const loop = () => { if (visible) { t += 0.016; draw(); } requestAnimationFrame(loop); };
      loop();
    }
  }
})();
