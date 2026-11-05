// Approved A silhouette. All production SVG/PNG/ICO variants derive from here.
export const brand = Object.freeze({
  name: 'Duik 中文指南', version: 'v1', base: '/brand/v1',
  colors: { vermilion: '#d63d2f', teal: '#147d83', ink: '#263c34', paper: '#f8f6f0' },
  canvas: 256, stroke: 18, introMs: 1800, loopMs: 4800,
  sizes: [16, 20, 24, 32, 40, 48, 64, 96, 128, 180, 192, 256, 512, 1024],
});
export const brandLinks = [
  {rel:'icon',type:'image/svg+xml',href:brand.base+'/logo.svg'},
  {rel:'icon',type:'image/png',sizes:'32x32',href:brand.base+'/logo-32.png'},
  {rel:'apple-touch-icon',sizes:'180x180',href:brand.base+'/apple-touch-icon.png'},
  {rel:'manifest',href:'/site.webmanifest'},
];
export const brandMetadata = {
  icons: {icon:brandLinks.filter(x=>x.rel==='icon').map(({href,...x})=>({...x,url:href})),
    apple:[{url:brand.base+'/apple-touch-icon.png',sizes:'180x180'}]},
  manifest:'/site.webmanifest',
};
export const brandManifest = {
  name:'Duik Ángela 非官方中文指南',short_name:'Duik 中文',start_url:'/',display:'browser',
  background_color:brand.colors.paper,theme_color:brand.colors.paper,
  icons:[192,512].map(size=>({src:`${brand.base}/logo-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))
    .concat([{src:brand.base+'/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]),
};
export const logoMotion = `:root{--ease-out:cubic-bezier(.23,1,.32,1);--ease-in-out:cubic-bezier(.77,0,.175,1)}g,path{transform-box:view-box}
.ring-entry{transform-origin:128px 137px;animation:ring-in 1450ms var(--ease-out) both}
.upper-entry{animation:upper-in 1000ms 300ms var(--ease-out) both}.lower-entry{animation:lower-in 1000ms 380ms var(--ease-out) both}
.ring{transform-origin:128px 137px;animation:ring-answer 4800ms var(--ease-in-out) infinite}
.hourglass{transform-origin:128px 139.5px;animation:sand-turn 4800ms var(--ease-in-out) infinite}
@keyframes ring-in{0%{transform:rotate(-145deg) scale(.94);opacity:0}72%{transform:rotate(8deg) scale(1);opacity:1}100%{transform:rotate(0deg);opacity:1}}
@keyframes upper-in{0%{transform:translate(-26px,-25px) rotate(-16deg);opacity:0}70%{transform:translate(0,3px);opacity:1}100%{transform:none;opacity:1}}
@keyframes lower-in{0%{transform:translate(26px,25px) rotate(16deg);opacity:0}70%{transform:translate(0,-3px);opacity:1}100%{transform:none;opacity:1}}
@keyframes ring-answer{0%,12%,48%,62%,98%,100%{transform:rotate(0)}27%,77%{transform:rotate(-12deg)}38%,88%{transform:rotate(5deg)}}
@keyframes sand-turn{0%,12%{transform:rotate(0)}38%,62%{transform:rotate(180deg)}88%,100%{transform:rotate(360deg)}}`;

export function renderLogo({color='color',motion='static',maskable=false}={}) {
  if(!['color','mono','reverse'].includes(color)||!['static','intro','loader','loop'].includes(motion))throw Error('Unknown logo variant');
  const [ring,sand]=color==='mono'?[brand.colors.ink,brand.colors.ink]:color==='reverse'?['#ffffff','#ffffff']:[brand.colors.vermilion,brand.colors.teal];
  const body=`<g class="ring-entry"><g class="ring loop"><path d="M58 137a70 70 0 1 0 70-70l29-29" fill="none" stroke="${ring}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></g></g><g class="hourglass loop"><g class="upper-entry"><path d="M104 115h48l-24 24Z" fill="${sand}"/></g><g class="lower-entry"><path d="m128 139 24 25h-48Z" fill="${sand}"/></g></g>`;
  const styles=motion==='static'?'':`<style>${logoMotion}.loop{animation-delay:${motion==='loop'?0:brand.introMs}ms}${motion==='intro'?'.loop{animation:none}':''}${motion==='loop'?'[class*="entry"]{animation:none}':''}@media(prefers-reduced-motion:reduce){g,path{animation:none!important;opacity:1!important;transform:none!important}}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title"><title id="title">Duik 非官方中文指南</title>${styles}${maskable?`<path fill="${brand.colors.paper}" d="M0 0h256v256H0z"/><g transform="translate(20.48 20.48) scale(.84)">${body}</g>`:body}</svg>\n`;
}
