import '/character-rig.js';
import {navMarkup} from '/duik-landing-content.js';

const guide = '/docs/guide/';
let landingMounted = false;
const heroMounts = new WeakMap();

export function mountSlot(host) {
  mountLanding();
  if (!host.closest('.kp-home-hero-main-input-wrap')) return mountJourney(host);
  if (heroMounts.has(host)) return heroMounts.get(host);
  const lifetime = new AbortController();
  host.innerHTML = `<div class="duik-character-stage" aria-label="角色绑定交互演示">
    <div class="duik-stage-heading"><span><i></i> 角色结构预览</span><span>IK · 双臂 · 表情</span></div>
    <div class="duik-rig-viewport"></div>
    <div class="duik-rig-toolbar"><span data-rig-status role="status">正在加载角色…</span><button type="button" data-rig-retry hidden>重新加载角色</button><button type="button" data-rig-reset disabled>复位</button><button type="button" data-rig-controls aria-pressed="true" disabled>隐藏控制器</button></div>
  </div><p class="duik-demo-note">网页交互示意 · 实际角色绑定请在 After Effects 中使用 Duik</p>`;
  const stage = host.querySelector('.duik-character-stage'), viewport = host.querySelector('.duik-rig-viewport');
  const status = host.querySelector('[data-rig-status]'), reset = host.querySelector('[data-rig-reset]');
  const controls = host.querySelector('[data-rig-controls]'), retry = host.querySelector('[data-rig-retry]');
  let character, generation = 0, attemptLife, disposed = false;
  function loadCharacter() {
    if (disposed) return;
    const version = ++generation;
    attemptLife?.abort(); attemptLife = new AbortController();
    stage.dataset.rigState = 'loading'; reset.disabled = controls.disabled = true;
    retry.disabled = true; status.textContent = '正在加载角色…';
    viewport.innerHTML = '<character-rig id="duik-hero-character" src="/riglab-project/rig.json" interaction="both" controls="visible"></character-rig>';
    character = viewport.querySelector('character-rig');
    const current = character;
    const isCurrent = () => !disposed && generation === version && character === current;
    const fail = () => {
      if (!isCurrent() || stage.dataset.rigState === 'error') return;
      const hadFocus = document.activeElement === current;
      attemptLife.abort();
      stage.dataset.rigState = 'error'; reset.disabled = controls.disabled = true;
      status.textContent = '角色交互暂不可用，当前显示静态原图。';
      const fallback = document.createElement('img');
      fallback.src = '/riglab-project/source.png'; fallback.alt = '已确认角色的静态原图，交互暂不可用';
      viewport.replaceChildren(fallback); character = null;
      retry.hidden = false; retry.disabled = false;
      if (hadFocus) retry.focus({preventScroll:true});
    };
    current.addEventListener('rig-error', fail, {signal:attemptLife.signal});
    current.ready.then(() => {
      if (!isCurrent() || stage.dataset.rigState === 'error') return;
      const restoreFocus = document.activeElement === retry;
      stage.dataset.rigState = 'ready'; reset.disabled = controls.disabled = false;
      status.textContent = '拖动红色端点，试试角色的动作。';
      controls.setAttribute('aria-pressed', 'true'); controls.textContent = '隐藏控制器';
      retry.hidden = true; retry.disabled = false;
      if (restoreFocus) reset.focus({preventScroll:true});
    }, fail);
  }
  reset.addEventListener('click', () => character?.rig?.reset(), {signal:lifetime.signal});
  controls.addEventListener('click', event => {
    if (!character || stage.dataset.rigState !== 'ready') return;
    const show = character.getAttribute('controls') !== 'visible';
    character.setAttribute('controls', show ? 'visible' : 'hidden');
    event.currentTarget.setAttribute('aria-pressed', String(show));
    event.currentTarget.textContent = show ? '隐藏控制器' : '显示控制器';
  }, {signal:lifetime.signal});
  retry.addEventListener('click', loadCharacter, {signal:lifetime.signal});
  const cleanup = () => {
    if (disposed) return;
    disposed = true; generation++; attemptLife?.abort(); lifetime.abort();
    host.replaceChildren(); heroMounts.delete(host);
  };
  heroMounts.set(host, cleanup); loadCharacter();
  const debugURL = new URL(location.href);
  if (['127.0.0.1', 'localhost', '[::1]'].includes(debugURL.hostname)
    && debugURL.searchParams.get('rig-diagnostics') === '1') {
    import('/duik-experience/rig-diagnostics.mjs').then(module => {
      if (!disposed) module.mountRigDiagnostics(host, () => character, lifetime.signal);
    }).catch(error => console.warn('本地画布诊断未加载', error));
  }
  return cleanup;
}

function mountJourney(host) {
  const paths = [
    ['建立角色骨骼','先准备分层素材，再了解骨骼结构和自动绑定。','bones','阅读骨骼指南'],
    ['调整 IK 与约束','用约束连接肢体，再通过控制器调整角色姿势。','constraints','阅读约束指南'],
    ['整理关键帧','从姿态进入表演，了解动画与自动化工具。','animation','阅读动画指南'],
  ];
  host.innerHTML = `<div class="duik-journey"><div role="tablist" aria-label="选择学习情境">${paths.map(([title],i)=>`<button type="button" role="tab" id="duik-path-${i}" aria-controls="duik-path-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-path="${i}">${title}</button>`).join('')}</div><div role="tabpanel" id="duik-path-panel" aria-labelledby="duik-path-0" tabindex="0"><p></p><a class="duik-primary"></a></div></div>`;
  const buttons=[...host.querySelectorAll('[data-path]')], panel=host.querySelector('[role=tabpanel]');
  const select = i => { buttons.forEach((button,k)=>{button.setAttribute('aria-selected',String(k===i));button.tabIndex=k===i?0:-1;});panel.setAttribute('aria-labelledby','duik-path-'+i);panel.querySelector('p').textContent=paths[i][1];panel.querySelector('a').textContent=paths[i][3]+' ↗';panel.querySelector('a').href=guide+paths[i][2]; };
  buttons.forEach((button,i)=>{button.onclick=()=>select(i);button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;select(next);buttons[next].focus();};});
  select(0);return () => host.replaceChildren();
}

export function mountNavigation(header){
  if(!header||header.dataset.duikNavigationMounted)return;
  if(!header.querySelector('.duik-site-nav'))header.insertAdjacentHTML('beforeend',navMarkup);
  header.dataset.duikReady='true';header.dataset.duikNavigationMounted='true';
  const lifetime=new AbortController(),options={signal:lifetime.signal};
  const button=header.querySelector('.duik-menu-toggle');
  const close=()=>{header.classList.remove('duik-menu-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','展开导航');};
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'收起导航':'展开导航');header.classList.toggle('duik-menu-open',open);},options);
  header.addEventListener('keydown',event=>{if(event.key==='Escape'){close();button.focus();}},options);
  header.querySelectorAll('a').forEach(a=>a.addEventListener('click',close,options));
  header.duikDisposeNavigation=()=>{lifetime.abort();delete header.dataset.duikNavigationMounted;delete header.duikDisposeNavigation;};
  mountLanding();
}

function mountLanding() {
  if (landingMounted) return;
  landingMounted=true;document.documentElement.dataset.duikTheme='light';document.documentElement.lang='zh-CN';
  requestAnimationFrame(()=>{
    mountWallMotion();
    const header=document.querySelector('header');
    mountNavigation(header);
  });
  // Copied Nuxt links do not own the Nextra /docs router. Keep these ordinary page navigations.
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a');
    if(!anchor||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.target==='_blank')return;
    const url=new URL(anchor.href,location.href);
    if(anchor.matches('a[data-duik-wall-guide]')&&document.documentElement.dataset.duikDragClick==='true'){
      event.preventDefault();event.stopImmediatePropagation();delete document.documentElement.dataset.duikDragClick;return;
    }
    if(url.origin===location.origin&&url.pathname.startsWith('/docs')){event.preventDefault();event.stopImmediatePropagation();location.assign(url.href);}
    else if(url.origin===location.origin&&url.pathname===location.pathname&&(url.hash||anchor.getAttribute('href')==='#')){
      const target=url.hash?document.getElementById(decodeURIComponent(url.hash.slice(1))):null;
      if(url.hash&&!target)return;
      event.preventDefault();event.stopImmediatePropagation();
      const menu=document.querySelector('header');menu?.classList.remove('duik-menu-open');const toggle=menu?.querySelector('.duik-menu-toggle');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','展开导航');
      const finish=()=>{if(target&&event.detail===0){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}};
      // Lenis already subtracts the target's CSS scroll margin. Add only the
      // remaining header inset, otherwise an 84px margin becomes a 168px gap.
      const margin=target?(parseFloat(getComputedStyle(target).scrollMarginTop)||0):0;
      if(window.lenis?.scrollTo)window.lenis.scrollTo(target||0,{offset:target?margin-84:0,duration:.85,immediate:matchMedia('(prefers-reduced-motion: reduce)').matches,onComplete:finish});
      else{window.scrollTo({top:target?target.getBoundingClientRect().top+scrollY-84:0,behavior:'auto'});finish();}
      history.replaceState(history.state,'',url.hash||location.pathname);
    }
  },true);
}

// SVG image documents cannot be paused by CSS on their parent. Select a real
// poster while a card is offscreen, the tab is hidden, or reduced motion is on.
function mountWallMotion(){
  const wall=document.querySelector('.kp-home-hero-thumbnails-list');
  if(!wall||wall.dataset.motionManaged)return;
  wall.dataset.motionManaged='true';
  const lifetime=new AbortController(),signal=lifetime.signal;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const visible=new Map(),images=new Map();let disposed=false;
  function sync(){
    if(disposed)return;
    for(const [picture,isVisible] of visible){
      const source=picture.querySelector('[data-duik-wall-playback]');
      const running=isVisible&&!preference.matches&&!document.hidden;
      if(source)source.media=running?'not all':'all';
      picture.dataset.wallMotion=running?'playing':'poster';
    }
  }
  // Observe rendered image boxes: a display:contents picture has no geometry.
  const boxes=new IntersectionObserver(entries=>{
    if(disposed)return;
    for(const entry of entries){
      const picture=entry.target.closest('picture');
      // unobserve/disconnect do not make an already queued delivery current.
      if(picture?.isConnected&&wall.contains(picture)&&images.get(picture)===entry.target)visible.set(picture,entry.isIntersecting);
    }
    sync();
  },{threshold:.01});
  function discover(){
    if(disposed)return;
    for(const [picture,img] of images)if(!picture.isConnected||!wall.contains(picture)||picture.querySelector('img')!==img){boxes.unobserve(img);images.delete(picture);visible.delete(picture);}
    for(const source of wall.querySelectorAll('[data-duik-wall-playback]')){const picture=source.parentElement,img=picture.querySelector('img');if(img&&!visible.has(picture)){visible.set(picture,false);images.set(picture,img);boxes.observe(img);}}
    sync();
  }
  const mutations=new MutationObserver(discover);mutations.observe(wall,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',sync,{signal});preference.addEventListener('change',sync,{signal});
  addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;boxes.disconnect();mutations.disconnect();visible.clear();images.clear();lifetime.abort();},{signal});
  discover();
}
