(() => {
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),images=[...document.querySelectorAll('[data-motion]')],visible=new Map();
  let stopped=false;
  function sync(){if(stopped)return;for(const img of images){const motion=visible.get(img)&&!document.hidden&&!preference.matches;const src='/brand/v1/logo'+(motion?img.dataset.motion==='loader'?'-loop':'-intro':'')+'.svg';if(img.getAttribute('src')!==src)img.src=src;}}
  const observer=new IntersectionObserver(entries=>{for(const e of entries)visible.set(e.target,e.isIntersecting);sync();});images.forEach(img=>observer.observe(img));
  document.querySelector('[data-replay]').addEventListener('click',()=>{const img=images.find(x=>x.dataset.motion==='intro');img.src='/brand/v1/logo'+(preference.matches?'':'-intro')+'.svg?replay='+Date.now();});
  document.addEventListener('visibilitychange',sync);preference.addEventListener('change',sync);
  addEventListener('pagehide',event=>{images.forEach(img=>img.src='/brand/v1/logo.svg');if(!event.persisted){stopped=true;observer.disconnect();document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);}});
  addEventListener('pageshow',event=>{if(event.persisted)sync();});
})();
