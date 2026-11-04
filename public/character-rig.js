import {mountCharacterRig} from './character-rig-core.js';

const template=`
<style>
:host{display:block;position:relative;aspect-ratio:var(--rig-aspect,1.16);min-width:0;contain:layout style}
*{box-sizing:border-box}.stage{position:absolute;inset:0;overflow:hidden;background:var(--rig-background,transparent);border-radius:var(--rig-radius,0)}
canvas,svg{position:absolute;inset:0;width:100%;height:100%}svg{pointer-events:none}svg .handle{pointer-events:all;touch-action:none;cursor:grab}svg .handle:active{cursor:grabbing}
svg text{pointer-events:none}.controller-label{font:17px system-ui;fill:#5e5060;stroke:#fff8e5;stroke-width:4px;paint-order:stroke}.controller-label.on-hover{display:none}.handle:hover .on-hover,.handle:focus .on-hover{display:block}
.handle:focus{outline:none}.handle:focus .hit-target{stroke:#b83c7a;stroke-width:1;stroke-dasharray:3 4}
#sourceImage{position:absolute;pointer-events:none}#sourceImage[hidden]{display:none}.stage-label{position:absolute;font:9px system-ui;transform:translateX(-50%);white-space:nowrap;color:#756357;pointer-events:none}
.status{position:absolute;left:12px;bottom:12px;right:12px;font:12px/1.5 system-ui;color:var(--rig-status-color,#705d53);pointer-events:none}.status:empty{display:none}.status.error{color:#b22}
:host([controls="hover"]) #controls{opacity:0}:host([controls="hover"]) .handle{pointer-events:none}:host([controls="hover"]:hover) #controls,:host([controls="hover"]:focus-within) #controls{opacity:1}:host([controls="hover"]:hover) .handle,:host([controls="hover"]:focus-within) .handle{pointer-events:all}
</style>
<div class="stage" id="stage"><canvas id="rigCanvas" width="1312" height="1199" aria-label="可交互的 2D 角色"></canvas><svg id="controls" aria-label="角色姿态控制器"></svg><img id="sourceImage" hidden alt="原图对照"><div id="stageLabels" aria-hidden="true"></div><div class="status" role="status">正在加载角色…</div></div>`;

/** Framework-neutral element; all drawing state and DOM are instance-local. */
export class CharacterRigElement extends (globalThis.HTMLElement||class{}){
  static get observedAttributes(){return ['src','interaction','controls'];}
  constructor(){
    super();this.attachShadow({mode:'open'}).innerHTML=template;
    this.rig=null;this.ready=Promise.resolve(null);this._version=0;this._inView=true;
  }
  connectedCallback(){this._mount();}
  disconnectedCallback(){this._dispose();}
  attributeChangedCallback(name,oldValue,value){
    if(oldValue===value||!this.isConnected)return;
    if(name==='src'){this._mount();return;}
    if(this.rig)this.rig.configure(this._options());
  }
  _options(){return {interaction:this.getAttribute('interaction')||'hover',showControls:['visible','hover',''].includes(this.getAttribute('controls'))};}
  _dispose(){
    this._version++;this._observer?.disconnect();this._life?.abort();this.rig?.destroy();this.rig=null;
  }
  _mount(){
    this._dispose();const version=this._version,source=this.getAttribute('src');
    const status=this.shadowRoot.querySelector('.status');status.className='status';
    if(!source){status.textContent='请设置角色 rig.json 的 src';this.ready=Promise.resolve(null);return;}
    status.textContent='正在加载角色…';this._life=new AbortController();const signal=this._life.signal;
    this.ready=(async()=>{
      try{
        const elements=Object.fromEntries(['stage','rigCanvas','controls','sourceImage','stageLabels'].map(id=>[id,this.shadowRoot.getElementById(id)]));
        const options=this._options();
        const rig=await mountCharacterRig({elements,manifestURL:new URL(source,this.ownerDocument.baseURI),signal,interaction:options.interaction,controls:options.showControls,
          onChange:state=>{if(version===this._version)this.dispatchEvent(new CustomEvent('rig-change',{detail:state,bubbles:true,composed:true}));},
          onError:error=>{status.textContent=error.message;status.className='status error';this.dispatchEvent(new CustomEvent('rig-error',{detail:{message:error.message},bubbles:true,composed:true}));}});
        if(version!==this._version||!this.isConnected){rig.destroy();throw new DOMException('Unmounted','AbortError');}
        this.rig=rig;rig.configure(this._options());status.textContent='';
        const update=()=>rig.setActive(this._inView&&!document.hidden);
        this._observer=new IntersectionObserver(entries=>{this._inView=entries[0].isIntersecting;update();});this._observer.observe(this);
        document.addEventListener('visibilitychange',update,{signal});
        this.dispatchEvent(new CustomEvent('rig-ready',{detail:{sourceSha256:rig.getState().sourceSha256},bubbles:true,composed:true}));
        return rig;
      }catch(error){
        if(version===this._version&&error.name!=='AbortError'){status.textContent=error.message;status.className='status error';this.dispatchEvent(new CustomEvent('rig-error',{detail:{message:error.message},bubbles:true,composed:true}));}
        throw error;
      }
    })();
    // Preserve rejection for await ready while avoiding an unhandled rejection when removed mid-load.
    this.ready.catch(()=>{});
  }
}

export function defineCharacterRig(name='character-rig'){
  if(globalThis.customElements&&!customElements.get(name))customElements.define(name,CharacterRigElement);
}
defineCharacterRig();
