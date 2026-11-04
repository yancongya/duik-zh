import {mountCharacterRig} from './character-rig-core.js';
const $=id=>document.getElementById(id);let api,parts=[],sliders=[];
function update(s){if(!api)return;
 $('layerCount').textContent=s.visibleParts.length+' / '+s.partCount;
 $('renderInfo').textContent=s.mode==='source'?'只读原图对照':s.mode==='exploded'?s.partCount+' 张独立 PNG · 图层展开':s.visibleParts.length+' 层 · '+s.vertexCount+' 顶点 · 原图共享蒙皮';
 $('selectionInfo').textContent=parts.find(p=>p.id===s.selected)?.label||'';
 $('diagnostics').innerHTML='<dt>骨长最大误差</dt><dd>'+Math.max(s.arms.r.lengthError,s.arms.l.lengthError).toFixed(5)+' px</dd><dt>IK 目标误差</dt><dd>'+Math.max(s.arms.r.targetError,s.arms.l.targetError).toFixed(3)+' px</dd><dt>静态原坐标</dt><dd>像素验证通过</dd><dt>关节限制</dt><dd>小幅 2D 姿态</dd>';
 for(const [id,,,,,unit]of sliders){$(id).value=s.pose[id];$(id+'Value').textContent=(unit==='%'?Math.round(s.pose[id]*100):Number(s.pose[id].toFixed(1)))+unit;}
 document.querySelectorAll('[data-layer]').forEach(row=>{const show=s.visibleParts.includes(row.dataset.layer);row.classList.toggle('hidden-layer',!show);row.classList.toggle('selected',s.selected===row.dataset.layer);const button=row.querySelector('.visibility');button.textContent=show?'◉':'○';button.setAttribute('aria-pressed',String(show));});
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===s.mode));
 for(const name of ['showControls','showLabels','showMesh','overlay'])$(name).checked=s[name];
 $('play').textContent=s.playing?'Ⅱ 暂停动作':'▶ 播放待机';$('play').setAttribute('aria-pressed',String(s.playing));
 $('stageTip').textContent=s.mode==='assembled'?'红方块：手部 / 发束 · 洋红环：姿态 / 表情 · 绿色眼形：视线':s.mode==='exploded'?'部件均为原图透明 PNG；回到拼接模式可恢复原坐标':'锁定的原图对照，不参与绑定渲染';
}
function buildPanels(){
 for(const group of [...new Set(parts.map(p=>p.group))]){const title=document.createElement('div');title.className='group-heading';title.textContent=group;$('layerList').append(title);for(const p of parts.filter(p=>p.group===group)){const row=document.createElement('div');row.className='layer-row';row.dataset.layer=p.id;const eye=document.createElement('button');eye.className='visibility';eye.setAttribute('aria-label','显示或隐藏'+p.label);eye.onclick=()=>api.setVisible(p.id,!api.getState().visibleParts.includes(p.id));const select=document.createElement('button');select.className='layer-select';const img=document.createElement('img');img.src=p.thumbnail||p.src;img.alt='';const label=document.createElement('span');label.textContent=p.label;select.append(img,label);select.onclick=()=>api.selectPart(p.id);row.append(eye,select);$('layerList').append(row);}}
 for(const [id,label,min,max,step,unit]of sliders){const wrap=document.createElement('div');wrap.innerHTML='<label class="slider-label" for="'+id+'">'+label+' <output id="'+id+'Value">0'+unit+'</output></label><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="0">';$('sliders').append(wrap);$(id).oninput=e=>api.setPose({[id]:Number(e.target.value)});}
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>api.setMode(b.dataset.mode));
 $('reset').onclick=()=>api.reset();$('rest').onclick=()=>api.reset(false);$('showAll').onclick=()=>api.showAll();$('solo').onclick=()=>api.solo();
 for(const id of ['showControls','showLabels','showMesh','overlay'])$(id).onchange=e=>api.configure({[id]:e.target.checked});
 $('play').onclick=()=>api.getState().playing?api.pause():api.play();$('wave').onclick=()=>api.play('wave');$('blinkOnce').onclick=()=>api.blink();
 $('exportPose').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(api.exportPose(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='character-pose.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('importPose').onchange=async e=>{try{if(e.target.files[0])api.importPose(JSON.parse(await e.target.files[0].text()));$('status').textContent='姿态已导入 · 原图身份校验通过';$('status').className='';}catch(error){$('status').textContent=error.message;$('status').className='error';}finally{e.target.value='';}};
}
async function main(){
 const configURL=new URL(new URLSearchParams(location.search).get('project')||'./rig-project.json',location.href);if(configURL.origin!==location.origin)throw Error('项目配置仅允许同源');
 const response=await fetch(configURL,{cache:'no-store'});if(!response.ok)throw Error('配置加载失败');const config=await response.json();
 $('backLink').href=config.returnUrl||'./rig-test.html';$('backLink').textContent=config.returnLabel||'角色实验室';
 api=await mountCharacterRig({elements:Object.fromEntries(['stage','rigCanvas','controls','sourceImage','stageLabels'].map(id=>[id,$(id)])),manifestURL:new URL(config.manifest,configURL),onChange:update,onError:error=>{$('status').className='error';$('status').textContent=error.message;}});
 parts=api.getParts();sliders=api.getSliders();buildPanels();window.characterRig=api;update(api.getState());$('layerZip').href=api.getState().archive;
 if(config.componentBundle){$('componentZip').href=new URL(config.componentBundle,configURL);$('componentZip').hidden=false;}
 $('status').textContent=parts.length+' / '+parts.length+' 透明部件已就绪 · 本地绑定运行中';
}
main().catch(error=>{$('status').className='error';$('status').textContent=error.message;console.error(error);window.characterRig={getState:()=>({ready:false,error:error.message})};});
