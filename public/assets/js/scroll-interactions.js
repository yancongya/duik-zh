(() => {
  'use strict';
  if (window.__staticInteractionsReady) return;
  window.__staticInteractionsReady = true;
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = value => Math.min(1, Math.max(0, value));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let serial = 0;
  const identify = element => element.id || (element.id = `static-interaction-${++serial}`);
  const activate = (element, callback) => {
    if (!element.matches('button,a,input,textarea')) {
      element.setAttribute('role', 'button');
      element.tabIndex = 0;
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
      });
    }
    element.addEventListener('click', callback);
  };
  const expanded = (button, panel, open) => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-controls', identify(panel));
    panel.hidden = !open;
  };
  const status = document.createElement('div');
  status.className = 'static-status'; status.setAttribute('role', 'status'); status.hidden = true;
  document.body.append(status);
  let statusTimer;
  function notify(message) {
    clearTimeout(statusTimer); status.textContent = message; status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 6000);
  }

  // Captured Headless UI panels are absent. Reuse existing footer links as a local menu.
  const footerColumns = all('footer button[aria-label="Toggle Column"]').map(button => button.parentElement.parentElement);
  const menus = [];
  all('button[id^="headlessui-popover-button"]').forEach(button => {
    const mobile = button.title === 'Open/Close';
    const panel = document.createElement('nav');
    panel.className = `static-menu${mobile ? ' static-menu-mobile' : ''}`;
    panel.setAttribute('aria-label', mobile ? 'Navigation' : button.textContent.trim());
    const name = button.textContent.trim().toLowerCase();
    const aliases = { 'use cases': 'solutions', products: 'design apps', business: 'company', guides: 'resources', learn: 'resources' };
    const column = footerColumns.find(item => item.firstElementChild.textContent.trim().toLowerCase().includes(aliases[name] || name));
    const links = mobile ? all('footer a') : column ? all('a', column) : [];
    const seen = new Set();
    links.forEach(link => {
      const label = link.textContent.trim();
      if (!label || seen.has(label)) return;
      seen.add(label); const copy = link.cloneNode(true); copy.removeAttribute('id');
      all('[id]', copy).forEach(child => child.removeAttribute('id')); panel.append(copy);
    });
    button.parentElement.append(panel); expanded(button, panel, false);
    const close = () => expanded(button, panel, false);
    menus.push({ button, panel, close });
    activate(button, () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      menus.forEach(menu => menu.close()); expanded(button, panel, open);
    });
  });
  document.addEventListener('click', event => menus.forEach(menu => {
    if (!menu.panel.contains(event.target) && !menu.button.contains(event.target)) menu.close();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') menus.forEach(menu => {
      if (menu.button.getAttribute('aria-expanded') === 'true') { menu.close(); menu.button.focus(); }
    });
  });

  all('.kp-pill').forEach(button => {
    button.tabIndex = 0; button.setAttribute('aria-pressed', 'false');
    activate(button, () => {
      const on = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(on)); button.classList.toggle('static-pill-active', on);
    });
  });
  all('textarea[aria-label="AI Prompt Input"]').forEach(field => {
    const box = field.parentElement.parentElement;
    const submit = box.querySelector('a[aria-label="Start designing in Linearity"]');
    const ghost = field.previousElementSibling;
    const sync = () => { if (ghost) ghost.hidden = !!field.value; };
    field.addEventListener('input', sync);
    const send = event => { event.preventDefault(); notify(field.value.trim() ? 'Prompt saved locally. Generation is unavailable in this preview.' : 'Enter a prompt to try this local preview.'); };
    if (submit) submit.addEventListener('click', send);
    field.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) send(event); });
    const form = field.closest('form'); if (form) form.addEventListener('submit', send);
  });

  let dialog;
  all('[aria-label="Play video"]').forEach(button => activate(button, () => {
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.className = 'static-video';
      dialog.setAttribute('aria-label', 'Video preview');
      const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close video');
      const image = document.createElement('img'); image.src = '/assets/placeholders/graphic.svg'; image.alt = 'Local video placeholder';
      dialog.append(close, image); document.body.append(dialog);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => button.focus());
    }
    if (!dialog.open) dialog.showModal();
  }));

  all('.pricing-billing-tab').forEach(button => activate(button, () => {
    const section = button.closest('.home-pricing-kp'); if (!section) return;
    section.dataset.billing = button.dataset.billingTab;
    all('.pricing-billing-tab', section).forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  }));
  all('button[aria-label="Toggle FAQ"]').forEach(button => {
    const row = button.parentElement; const panel = row.nextElementSibling; if (!panel) return;
    const set = open => {
      expanded(button, panel, open); panel.style.gridTemplateRows = open ? '1fr' : '0fr';
      button.style.transform = open ? 'rotate(45deg)' : 'rotate(0deg)';
    };
    set(button.classList.contains('rotate-45'));
    row.addEventListener('click', event => { if (!event.target.closest('a')) set(button.getAttribute('aria-expanded') !== 'true'); });
  });
  all('footer button[aria-label="Toggle Column"]').forEach(button => {
    const panel = button.parentElement.nextElementSibling; if (!panel) return;
    button.setAttribute('aria-controls', identify(panel)); button.setAttribute('aria-expanded', 'false');
    activate(button, () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open)); panel.classList.toggle('static-footer-open', open);
    });
  });
  all('footer button').filter(button => button.textContent.trim() === 'Show more').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    const list = button.closest('ul'); if (!list) return;
    activate(button, () => {
      const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open));
      all(':scope > li.md\\:hidden', list).forEach(item => item.classList.toggle('static-footer-more', open));
      const icon = button.querySelector('svg'); if (icon) icon.style.transform = open ? 'rotate(180deg)' : '';
    });
  });
  all('button[aria-haspopup="listbox"]').forEach(button => {
    const panel = document.createElement('div'); panel.className = 'static-menu'; panel.setAttribute('role', 'listbox');
    const option = document.createElement('button'); option.type = 'button'; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'true'); option.textContent = button.textContent.trim(); panel.append(option);
    button.parentElement.append(panel); expanded(button, panel, false);
    menus.push({button,panel,close:()=>expanded(button,panel,false)});
    activate(button, () => expanded(button, panel, button.getAttribute('aria-expanded') !== 'true'));
    activate(option, () => { expanded(button, panel, false); button.focus(); });
  });

  const capabilities = document.querySelector('.kp-home-capabilities-wrap');
  const capabilityTrack = capabilities?.querySelector('.kp-home-capabilities-content');
  const capabilityCards = capabilities ? all('.kp-home-capabilities-content-list > div', capabilities) : [];
  let capabilityManualY = null;
  function setCapability(index) {
    if (!capabilityTrack) return;
    const items = [...capabilityCards, capabilities.querySelector('.home-testimonial-kp')].filter(Boolean);
    const item = items[index]; if (!item) return;
    capabilityTrack.style.transform = `translate3d(${-Math.max(0,item.offsetLeft - items[0].offsetLeft)}px,0,0)`;
    capabilityManualY = scrollY;
    all('.static-capability-controls button', capabilities).forEach((button,i)=>button.setAttribute('aria-pressed',String(index===i)));
  }
  if (capabilities && capabilityTrack) {
    const controls = document.createElement('div'); controls.className = 'static-capability-controls'; controls.setAttribute('aria-label','Capabilities');
    [...capabilityCards, capabilities.querySelector('.home-testimonial-kp')].filter(Boolean).forEach((card,index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = String(index+1); button.setAttribute('aria-label',`Capability ${index+1}`); button.setAttribute('aria-pressed',String(index===0));
      activate(button,()=>setCapability(index)); controls.append(button);
    });
    capabilities.querySelector('.kp-home-capabilities')?.append(controls);
  }
  const how = document.querySelector('.home-how-it-works-kp');
  const slideGroups = [];
  all('.home-how-it-works-kp, .home-testimonial-kp').forEach(section => {
    const cards = all('div.cursor-pointer', section).filter(card => card.querySelector('[class*="grid-rows-"]'));
    if (!cards.length) return;
    const group = {section, cards, active: -1}; slideGroups.push(group);
    group.set = index => {
      if (group.active === index) return; group.active = index;
      cards.forEach((card, i) => {
        const active = i === index; card.setAttribute('aria-expanded', String(active)); card.classList.toggle('static-slide-active', active);
        all('[class*="grid-rows-"]', card).forEach(panel => { panel.style.gridTemplateRows = active ? '1fr' : '0fr'; });
      });
    };
    cards.forEach((card,index) => activate(card, () => { group.set(index); group.manualY = scrollY; })); group.set(0);
  });
  // Swiper's captured transform is static. Native overflow supplies touch and keyboard paging.
  all('.swiper').forEach(swiper => {
    if (swiper.classList.contains('kp-badge-swiper')) return;
    const wrapper = swiper.querySelector('.swiper-wrapper'); if (!wrapper) return;
    wrapper.classList.add('static-carousel'); wrapper.style.transform = 'none'; swiper.style.overflow = 'auto'; swiper.style.scrollSnapType = 'x mandatory';
    const slides = all(':scope > .swiper-slide', wrapper);
    const bullets = all('[class*="pagination-bullet"]', swiper);
    bullets.forEach((bullet,index) => { bullet.setAttribute('aria-label', `Slide ${index + 1}`); activate(bullet, () => { swiper.scrollTo({left: slides[index]?.offsetLeft || 0, behavior: motion.matches ? 'instant' : 'smooth'}); }); });
    swiper.tabIndex = 0;
    swiper.addEventListener('keydown', event => {
      if (event.target !== swiper || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault(); swiper.scrollBy({left: (event.key === 'ArrowRight' ? 1 : -1) * swiper.clientWidth, behavior: motion.matches ? 'instant' : 'smooth'});
    });
    swiper.addEventListener('scroll', () => {
      const index = slides.reduce((best,slide,i) => Math.abs(slide.offsetLeft-swiper.scrollLeft) < Math.abs(slides[best].offsetLeft-swiper.scrollLeft) ? i : best,0);
      bullets.forEach((bullet,i) => { bullet.setAttribute('aria-current',String(i===index)); const prefix = [...bullet.classList].find(name=> name.endsWith('pagination-bullet')); if(prefix) bullet.classList.toggle(`${prefix}-active`,i===index); });
    }, {passive:true});
  });

  const hero = document.querySelector('.kp-home-hero-thumbnails-list');
  const heroCards = hero ? all(':scope > .absolute', hero) : [];
  const range = element => { const rect = element.getBoundingClientRect(); return clamp(-rect.top / Math.max(1,rect.height-innerHeight)); };
  let scheduled = false;
  function update() {
    scheduled = false;
    if (hero) {
      const progress = range(hero), offset = Math.max(0,-hero.getBoundingClientRect().top);
      document.documentElement.style.setProperty('--clone-hero-progress', progress.toFixed(3));
      heroCards.forEach((card,index) => {
        const local = clamp((progress-index/Math.max(1,heroCards.length-1)*.58)/.42);
        const lift = motion.matches ? 0 : (1-local)*(index%2?96:-96);
        const tilt = motion.matches ? 0 : (index%2?1:-1)*(1-local)*5;
        card.style.transform = `translate3d(0, ${offset+lift}px, 0) rotate(${tilt}deg)`;
        card.style.opacity = motion.matches ? '1' : String(.18+local*.82);
      });
    }
    if (capabilities && capabilityTrack && (capabilityManualY == null || Math.abs(scrollY-capabilityManualY)>24)) {
      capabilityManualY = null;
      const max = Math.max(0,capabilityTrack.scrollWidth-innerWidth);
      capabilityTrack.style.transform = `translate3d(${-range(capabilities)*max}px,0,0)`;
    }
    slideGroups.forEach(group => {
      if (group.section !== how || (group.manualY != null && Math.abs(scrollY-group.manualY)<24)) return;
      group.manualY = null; group.set(Math.min(group.cards.length-1,Math.floor(range(group.section)*group.cards.length)));
    });
  }
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  addEventListener('scroll',schedule,{passive:true}); addEventListener('resize',schedule,{passive:true});
  const setMotion = () => { document.body.classList.toggle('clone-motion-enabled',!motion.matches); schedule(); };
  motion.addEventListener('change',setMotion); setMotion();
  document.documentElement.classList.add('clone-scroll-ready');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('clone-revealed',entry.isIntersecting)),{threshold:.16});
    all('main > div > section, .home-how-it-works-kp, .kp-home-capabilities-wrap').forEach(element=>reveal.observe(element));
  }
  update();
})();
