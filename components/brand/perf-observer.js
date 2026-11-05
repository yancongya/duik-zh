// Loopback opt-in diagnostics (?perf=1). No network telemetry or normal-page timer.
(() => {
  if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).get('perf')!=='1')return;
  const supported=PerformanceObserver.supportedEntryTypes||[],observed={},errors=[],longTasks=[];
  const shiftSources=[];
  let lcp=null,cls=0,shifts=0,session=0,lastShift=0,firstShift=0;
  for(const type of ['largest-contentful-paint','layout-shift','longtask']){
    if(!supported.includes(type)){observed[type]=false;continue;}
    try{new PerformanceObserver(list=>{for(const e of list.getEntries()){
      if(type==='largest-contentful-paint')lcp={time:e.startTime,size:e.size,tag:e.element?.tagName,id:e.element?.id,html:e.element?.outerHTML?.slice(0,400),url:e.url};
      if(type==='layout-shift'&&!e.hadRecentInput){shifts++;shiftSources.push({time:e.startTime,value:e.value,sources:e.sources?.map(s=>({html:s.node?.outerHTML?.slice(0,300),before:s.previousRect,after:s.currentRect}))});if(e.startTime-lastShift>1000||e.startTime-firstShift>5000){session=0;firstShift=e.startTime;}session+=e.value;lastShift=e.startTime;cls=Math.max(cls,session);}
      if(type==='longtask')longTasks.push({start:e.startTime,duration:e.duration});
    }}).observe({type,buffered:true});observed[type]=true;}catch{observed[type]=false;}
  }
  addEventListener('error',e=>errors.push({type:'error',message:e.message||e.target?.src||'resource',time:performance.now()}),true);
  addEventListener('unhandledrejection',e=>errors.push({type:'rejection',message:String(e.reason),time:performance.now()}));
  function sample(){
    if(!document.body)return;
    let output=document.getElementById('duik-perf-report');if(!output){output=document.createElement('script');output.id='duik-perf-report';output.type='application/json';document.body.append(output);}
    output.textContent=JSON.stringify({evidence:'local browser lab; not production RUM',url:location.href,time:performance.now(),viewport:[innerWidth,innerHeight],boot:document.documentElement.dataset.duikBoot||'pending',rig:document.querySelector('.duik-character-stage')?.dataset.rigState,
      observed,lcp,cls:observed['layout-shift']?cls:null,shifts,shiftSources,longTasks,errors,paint:performance.getEntriesByType('paint').map(e=>e.toJSON()),navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),
      resources:performance.getEntriesByType('resource').map(e=>({name:e.name,type:e.initiatorType,bytes:e.encodedBodySize,transfer:e.transferSize,duration:e.duration,status:e.responseStatus})),
      brokenImages:[...document.images].filter(i=>(i.currentSrc||i.getAttribute('src'))&&i.complete&&!i.naturalWidth).map(i=>i.currentSrc||i.src),overflow:document.documentElement.scrollWidth>innerWidth});
  }
  performance.setResourceTimingBufferSize(2000);
  const timer=setInterval(sample,2000);addEventListener('pagehide',()=>{sample();clearInterval(timer);},{once:true});
  document.addEventListener('DOMContentLoaded',sample,{once:true});
})();
