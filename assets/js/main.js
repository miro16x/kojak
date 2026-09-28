/* Kojak Limousine LLC — shared site behavior */
document.addEventListener('DOMContentLoaded', () => {

  /* Icons */
  if (window.lucide) lucide.createIcons();

  /* Theme toggle (light/dark) */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('kojak-theme', next); } catch (e) {}
    });
  }

  /* Sticky header shadow */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile nav */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  if (navToggle && mobileNav) {
    const open = () => { mobileNav.classList.add('open'); document.body.style.overflow = 'hidden'; };
    const close = () => { mobileNav.classList.remove('open'); document.body.style.overflow = ''; };
    navToggle.addEventListener('click', open);
    mobileNavClose && mobileNavClose.addEventListener('click', close);
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  /* Active nav link */
  const path = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  /* Scroll reveal (IntersectionObserver, no GSAP dependency required) */
  const revealEls = document.querySelectorAll('.reveal, .fade-up');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay ? Number(el.dataset.delay) : 0;
          setTimeout(() => {
            el.style.transition = 'opacity .8s cubic-bezier(0.16,1,0.3,1), transform .8s cubic-bezier(0.16,1,0.3,1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.addEventListener('transitionend', () => {
              el.classList.remove('reveal', 'fade-up');
              el.style.transition = '';
              el.style.opacity = '';
              el.style.transform = '';
            }, { once: true });
          }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  /* Hero headline word reveal */
  const heading = document.getElementById('heroHeading');
  if (heading) {
    heading.querySelectorAll('.reveal-line').forEach(line => {
      const gradientEl = line.querySelector('.text-gradient');
      const gradientText = gradientEl ? gradientEl.textContent.trim() : null;
      const text = line.textContent;
      line.innerHTML = text.split(' ').map(w => {
        const cls = (gradientText && w.trim() === gradientText) ? 'reveal-word text-gradient' : 'reveal-word';
        return `<span class="${cls}">${w}&nbsp;</span>`;
      }).join('');
    });
    requestAnimationFrame(() => {
      const words = heading.querySelectorAll('.reveal-word');
      words.forEach((w, i) => {
        setTimeout(() => {
          w.style.transition = 'transform .9s cubic-bezier(0.16,1,0.3,1), opacity .9s cubic-bezier(0.16,1,0.3,1)';
          w.style.transform = 'translateY(0)';
          w.style.opacity = '1';
        }, 120 + i * 45);
      });
    });
    document.querySelectorAll('.fade-up').forEach((el, i) => {
      if (el.closest('.hero-copy')) {
        setTimeout(() => {
          el.style.transition = 'opacity .9s cubic-bezier(0.16,1,0.3,1), transform .9s cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 500 + i * 130);
      }
    });
  }

  /* Ambient light-streak canvas — echoes hero.txt's particle field, re-themed.
     Reusable so both the hero panel and the full-page background can share it. */
  function initStreakCanvas(canvas, opts) {
    if (!canvas || !canvas.getContext) return;
    opts = opts || {};
    const density = opts.density || 34000;
    const fadeDelay = opts.fadeDelay != null ? opts.fadeDelay : 200;
    const ctx = canvas.getContext('2d');
    let w, h, streaks = [];
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const colors = ['201,168,106', '20,168,157', '197,139,143'];
    const init = () => {
      const count = Math.max(14, Math.round((w * h) / density));
      streaks = Array.from({ length: count }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h + h,
        len: Math.random() * 70 + 40,
        speed: Math.random() * 0.35 + 0.12,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.35 + 0.12
      }));
    };
    resize(); init();
    window.addEventListener('resize', () => { resize(); init(); });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      streaks.forEach(s => {
        s.y -= s.speed;
        if (s.y + s.len < 0) { s.y = h + Math.random() * 100; s.x = Math.random() * w; }
        const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.len);
        g.addColorStop(0, `rgba(${s.color},${s.alpha})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.len);
        ctx.stroke();
      });
      requestAnimationFrame(draw);
    };
    draw();
    setTimeout(() => { canvas.style.transition = 'opacity 1.8s ease'; canvas.style.opacity = '1'; }, fadeDelay);
  }

  initStreakCanvas(document.getElementById('hero-canvas'));
  initStreakCanvas(document.getElementById('page-canvas'), { density: 60000, fadeDelay: 400 });

  /* Floating card gentle float */
  document.querySelectorAll('.floating-card').forEach((card, i) => {
    let t = 0;
    const anim = () => {
      t += 0.012;
      card.style.transform = `translateY(${Math.sin(t + i) * 8}px)`;
      requestAnimationFrame(anim);
    };
    anim();
  });

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q && q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) { other.classList.remove('open'); other.querySelector('.faq-a').style.maxHeight = null; }
      });
      if (isOpen) { item.classList.remove('open'); a.style.maxHeight = null; }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* Pre-fill Book Now form fields from a query string, e.g. book.html?vehicle=suv
     or book.html?service=cruise — used by the Fleet "Reserve This Vehicle" and
     Services "Get a Quote" buttons so the matching option is already selected. */
  const params = new URLSearchParams(location.search);
  ['vehicle', 'service'].forEach((key) => {
    const select = document.getElementById(key);
    const requested = params.get(key);
    if (!select || !requested) return;
    const match = select.querySelector(`option[data-key="${requested}"]`);
    if (match) select.value = match.value || match.textContent;
  });

  /* Reservation form */
  const bookForm = document.getElementById('bookingForm');
  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!bookForm.checkValidity()) { bookForm.reportValidity(); return; }
      bookForm.style.display = 'none';
      const success = document.getElementById('bookingSuccess');
      if (success) success.classList.add('show');
    });
  }

  /* Contact form */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
      contactForm.style.display = 'none';
      const success = document.getElementById('contactSuccess');
      if (success) success.classList.add('show');
    });
  }

  /* Testimonial slider (simple auto-rotate on mobile track) */
  const track = document.querySelector('.testi-track');
  if (track) {
    let idx = 0;
    const cards = track.querySelectorAll('.quote-card');
    const dotsWrap = document.querySelector('.testi-dots');
    if (dotsWrap && cards.length > 1) {
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testi-dot';
        dot.addEventListener('click', () => go(i));
        dotsWrap.appendChild(dot);
      });
      const setActive = () => {
        dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
      };
      var go = (i) => { idx = i; track.style.transform = `translateX(-${i * 100}%)`; setActive(); };
      setActive();
    }
  }
});
