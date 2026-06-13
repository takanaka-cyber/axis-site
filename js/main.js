// AXIS — cinematic storytelling layer
// GSAP ScrollTrigger (chapter scenes / color journey) + Lenis (buttery scroll)
// + cursor / menu / scrollnav / concept wave canvas
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const cinematic = hasGsap && !reduced;

  // no JS-driven motion → reveal everything that CSS hides behind the .js flag
  if (!cinematic) document.documentElement.classList.remove('js');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll: Lenis driven by the GSAP ticker ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.35, smoothWheel: true, wheelMultiplier: 0.95 });
    window.lenis = lenis;
    if (cinematic) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
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
      if (lenis) lenis.scrollTo(target, { offset: -headerH, duration: 1.6 });
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

  /* ---------- scroll indicator (current chapter) ---------- */
  const sections = Array.from(document.querySelectorAll('[data-sec]'));
  const curEl = document.getElementById('scrollnav-cur');
  const fillEl = document.getElementById('scrollnav-fill');
  const onScrollNav = () => {
    const mid = window.scrollY + window.innerHeight * 0.45;
    let cur = '01';
    for (const s of sections) {
      let top = 0, n = s;
      while (n) { top += n.offsetTop; n = n.offsetParent; }
      if (top <= mid) cur = s.dataset.sec;
    }
    if (curEl && curEl.textContent !== cur) curEl.textContent = cur;
    if (fillEl) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fillEl.style.height = `${(window.scrollY / Math.max(max, 1)) * 100}%`;
    }
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

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

  /* ================================================================
     CINEMATIC SCENES — everything below requires GSAP + motion OK
  ================================================================ */
  if (!cinematic) return;

  const splitChars = (el) => {
    const out = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach((c) => {
            if (c.trim() === '') { frag.appendChild(document.createTextNode(c)); return; }
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            frag.appendChild(s);
            out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
    return out;
  };

  /* ---------- chapter color journey ---------- */
  // [background, accent] per chapter — deep black → indigo → teal → violet → ember → back
  const SCENES = {
    '01': ['#080D11', '#6A7CFF'],
    '02': ['#0A111E', '#6A7CFF'],
    '03': ['#0C1126', '#6A7CFF'],
    '04': ['#101824', '#00E5C2'],
    '05': ['#071A1D', '#00E5C2'],
    '06': ['#0B0F16', '#00E5C2'],
    '07': ['#140D1F', '#FF3D71'],
    '10': ['#080D11', '#6A7CFF'],
  };
  document.querySelectorAll('section[data-sec], footer[data-sec]').forEach((el) => {
    const scene = SCENES[el.dataset.sec];
    if (!scene) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle(self) {
        if (!self.isActive) return;
        gsap.to('html', {
          '--scene-bg': scene[0],
          '--scene-acc': scene[1],
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      },
    });
  });

  /* ---------- chapter ghost numbers (parallax watermarks) ---------- */
  document.querySelectorAll('section[data-sec], footer[data-sec]').forEach((sec) => {
    if (sec.dataset.sec === '01') return;
    const g = document.createElement('span');
    g.className = 'sec__ghost';
    g.textContent = sec.dataset.sec;
    g.setAttribute('aria-hidden', 'true');
    sec.appendChild(g);
    gsap.fromTo(g, { yPercent: 36 }, {
      yPercent: -36,
      ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- 01 hero: opening title sequence ---------- */
  const introLines = gsap.utils.toArray('.hero__title .line__in');
  gsap.set(introLines, { yPercent: 112, visibility: 'visible' });
  gsap.set('.hero-fade', { opacity: 0, y: 18 });
  gsap.set('.hero__orbit', { opacity: 0, scale: 0.92 });
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
    .to(introLines, { yPercent: 0, duration: 1.45, stagger: 0.1 }, 0.25)
    .to('.hero-fade', { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, '-=1.0')
    .to('.hero__orbit', { opacity: 0.8, scale: 1, duration: 1.8, ease: 'power2.out' }, '-=1.3');
  // throttled-tab safety: force-write final states once the sequence ends
  intro.eventCallback('onComplete', () => {
    gsap.set(introLines, { yPercent: 0 });
    gsap.set('.hero-fade', { opacity: 1, y: 0 });
  });
  if (document.readyState === 'complete') intro.play();
  else window.addEventListener('load', () => intro.play());

  // scroll-out: the opening shot sinks away as chapter 02 arrives
  gsap.timeline({
    scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom 35%', scrub: true },
  })
    .to('.hero__inner', { yPercent: -12, opacity: 0.12, ease: 'none' }, 0)
    .to('.hero__orbit', { yPercent: 24, ease: 'none' }, 0)
    .to('.hero__canvas', { scale: 1.08, ease: 'none' }, 0);

  /* ---------- chapter titles: per-character reveal ---------- */
  document.querySelectorAll('.sec__title, .band__title').forEach((t) => {
    const chars = splitChars(t);
    gsap.set(chars, { opacity: 0, y: '0.55em' });
    ScrollTrigger.create({
      trigger: t,
      start: 'top 84%',
      once: true,
      onEnter: () => gsap.to(chars, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.022,
      }),
    });
  });

  /* ---------- generic scene entrances ---------- */
  gsap.utils.toArray(
    '.sec__rail, .sec__text, .concept__sub, .footer__brand, .footer__dl, .footer__nav, .footer__bottom'
  ).forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 40, duration: 1.05, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const batchRise = (sel, y = 80) => {
    const items = gsap.utils.toArray(sel);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y });
    ScrollTrigger.batch(items, {
      start: 'top 86%',
      once: true,
      onEnter: (b) => gsap.to(b, {
        opacity: 1, y: 0, duration: 1.15, ease: 'power3.out', stagger: 0.12,
        // free the inline transform so CSS hover transforms (e.g. card lift) work again
        onComplete: () => gsap.set(b, { clearProps: 'transform' }),
      }),
    });
  };
  batchRise('.cards-3 .card');
  batchRise('.works__item');
  batchRise('.band__card', 100);

  // strength: rise + trigger the icon line-drawing
  const sItems = gsap.utils.toArray('.strength__item');
  gsap.set(sItems, { opacity: 0, y: 70 });
  ScrollTrigger.batch(sItems, {
    start: 'top 86%',
    once: true,
    onEnter: (b) => {
      b.forEach((el) => el.classList.add('is-in'));
      gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14 });
    },
  });

  /* ---------- image parallax (scrub) ---------- */
  gsap.utils.toArray('[data-prlx]').forEach((img) => {
    gsap.fromTo(img,
      { yPercent: -7, scale: 1.16 },
      {
        yPercent: 7, scale: 1.16, ease: 'none',
        scrollTrigger: {
          trigger: img.closest('figure') || img,
          start: 'top bottom', end: 'bottom top', scrub: true,
        },
      });
  });

  /* ---------- 02 concept: waves surface with the scene ---------- */
  gsap.fromTo('.concept__canvas', { opacity: 0.12 }, {
    opacity: 0.8, ease: 'none',
    scrollTrigger: { trigger: '#concept', start: 'top 85%', end: 'center 45%', scrub: true },
  });

  /* ---------- 05 flow: pinned horizontal tracking shot ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const clip = document.querySelector('.flow-clip');
    const track = document.querySelector('.flow');
    if (!clip || !track) return;
    const dist = () => Math.max(0, track.scrollWidth - clip.clientWidth);
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '#flow',
        start: 'top top',
        end: () => '+=' + dist(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    gsap.utils.toArray('.flow__item').forEach((it) => {
      gsap.from(it, {
        y: 70, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: it, containerAnimation: tween, start: 'left 92%', once: true },
      });
    });
  });
  mm.add('(max-width: 860px)', () => {
    batchRise('.flow__item', 60);
  });

  /* ---------- 10 company: closing credits ---------- */
  const logo = document.querySelector('.footer__logo');
  if (logo) {
    const chars = splitChars(logo);
    gsap.set(chars, { opacity: 0, y: '0.45em' });
    ScrollTrigger.create({
      trigger: logo,
      start: 'top 92%',
      once: true,
      onEnter: () => gsap.to(chars, {
        opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', stagger: 0.07,
      }),
    });
  }
})();
