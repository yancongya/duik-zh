  // Included inside the browser harness try block; helpers are shared in scope.
  const character='document.querySelector("#duik-hero-character")';
  const pose=()=>evaluate(character+'.rig.getState().pose');
  async function key(keyName,virtualKey){
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:keyName,code:keyName,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:keyName,code:keyName,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
    await delay(150);
  }
  async function clickExpression(expression){
    const point=await evaluate('(()=>{const e='+expression+';const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    await delay(450);
  }
  async function scrollTo(expression){
    await evaluate(expression+'.scrollIntoView({block:"center",behavior:"instant"})');
    await delay(700);
  }
  async function waitHost(){
    // The retained template intentionally reloads when a responsive breakpoint is crossed.
    await delay(1500);
    for(let i=0;i<80;i++){
      try{if(await evaluate('!!document.querySelector("#duik-hero-character")?.rig&&!!document.querySelector(".duik-menu-toggle")'))return;}catch{}
      await delay(250);
    }
    throw Error('Host did not remount after the template breakpoint reload');
  }
  const controls=()=>evaluate(character+'.shadowRoot.querySelectorAll("[data-control]").length');
  assert.equal(await controls(),12,'All reference-style control handles are visible');
  for(const [control,field] of [['head','head'],['root','rootX']]){
    const before=await pose();
    await evaluate(character+'.shadowRoot.querySelector("[data-control='+control+']").focus({preventScroll:true})');
    await key('ArrowRight',39);
    assert((await pose())[field]>before[field],control+' responds to a real keyboard arrow');
  }
  checks.push('Hero head and waist controllers respond to keyboard input');
  await screenshot('03-hero-keyboard');
  await click('[data-rig-reset]');
  const reset=await pose();
  assert.equal(reset.head,0);assert.equal(reset.rootX,0);assert.deepEqual(reset.handL,[0,0]);
  await click('[data-rig-controls]');
  assert.equal(await controls(),0,'Hidden controllers leave no hit targets');
  assert.equal(await evaluate('document.querySelector("[data-rig-controls]").getAttribute("aria-pressed")'),'false');
  await click('[data-rig-controls]');
  assert.equal(await controls(),12);
  checks.push('Reset restores pose; controls can be hidden and shown again');
  const box=await evaluate(character+'.getBoundingClientRect().toJSON()');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+box.width*.83,y:box.y+box.height*.2});
  await delay(500);
  assert(Math.abs((await pose()).head)>.05,'Hover changes the rendered head pose');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:120});
  await delay(800);
  checks.push('Hero hover drives a bounded character reaction');
  const pill='h1 .kp-pill--person';
  const oldLabel=await evaluate('document.querySelector('+JSON.stringify(pill)+').innerText');
  await click(pill);await delay(350);
  assert.notEqual(await evaluate('document.querySelector('+JSON.stringify(pill)+').innerText'),oldLabel);
  checks.push('Original rotating Hero pill still advances on click');
  assert.equal(await evaluate('getComputedStyle(document.documentElement).backgroundColor'),'rgb(248, 246, 240)');
  assert.equal(await evaluate('document.documentElement.lang'),'zh-CN');
  assert(!await evaluate('document.title.includes("Linearity")'));
  checks.push('Host is Chinese and light themed, with project-specific page metadata');
  const faq='document.querySelectorAll('+JSON.stringify('button[aria-label="Toggle FAQ"]')+')';
  const faqFirst=faq+'[0]',faqSecond=faq+'[1]';
  await scrollTo(faqFirst);
  const faqOpen=expression=>evaluate(expression+'.parentElement.parentElement.querySelector(".grid").className.includes("grid-rows-[1fr]")');
  assert.equal(await faqOpen(faqFirst),true,'Original first FAQ starts open');
  await clickExpression(faqFirst);assert.equal(await faqOpen(faqFirst),false);
  await clickExpression(faqSecond);assert.equal(await faqOpen(faqSecond),true);
  assert.equal(await faqOpen(faqFirst),false);
  await screenshot('04-faq');checks.push('FAQ closes and opens answers using the original interaction');
  const journey='document.querySelector(".duik-journey")';
  await scrollTo(journey);
  await click('[data-path="1"]');
  assert.equal(await evaluate('document.querySelector("#duik-path-panel a").getAttribute("href")'),'/docs/guide/constraints');
  assert.equal(await evaluate('document.querySelectorAll("[data-path]")[1].getAttribute("aria-selected")'),'true');
  await evaluate('document.querySelectorAll("[data-path]")[1].focus()');await key('End',35);
  assert.equal(await evaluate('document.querySelector("#duik-path-panel a").getAttribute("href")'),'/docs/guide/animation');
  await screenshot('05-learning');checks.push('Learning tabs support clicks, keyboard selection, and correct guide routes');
  report.routeChecks=[];
  for(const route of ['/docs','/docs/getting-started/install','/docs/getting-started/introduction','/docs/guide/bones','/docs/guide/constraints','/docs/guide/animation','/docs/guide/controllers','/docs/faq','/docs/misc/credits','/docs/misc/doc-license']){
    const response=await fetch(new URL(route,url));report.routeChecks.push({route,status:response.status});assert(response.ok,'Missing route '+route);
  }
  checks.push('All 10 advertised documentation routes return HTTP 200');
  // Return through the template's actual scroll owner. A native instant jump
  // can report scrollY=0 while the animated header is still at y=-77.
  assert(await evaluate('!!window.lenis'),'Original Lenis instance is available');
  report.ctaHit=await evaluate('(async()=>{window.lenis.scrollTo(0,{immediate:true,force:true});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const a=document.querySelector(".duik-nav-cta");let last=null,stable=0;for(let frame=0;frame<90;frame++){await new Promise(requestAnimationFrame);const rect=a.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2,hit=document.elementFromPoint(x,y);stable=last&&Math.abs(rect.x-last.x)<.1&&Math.abs(rect.y-last.y)<.1?stable+1:0;if(stable>=2&&a.contains(hit))return {frame,stable,rect:rect.toJSON(),x,y,hit:{tag:hit.tagName,class:hit.className},href:a.getAttribute("href")};last={x:rect.x,y:rect.y};}throw Error("Header CTA never became a stable, real hit target")})()');
  assert.equal(report.ctaHit.href,'/docs');
  await clickExpression('document.querySelector(".duik-nav-cta")');
  for(let i=0;i<60;i++){
    if(await evaluate('location.pathname==="/docs"&&!!document.querySelector("main h1")'))break;
    await delay(250);
  }
  report.navigation=await evaluate('({path:location.pathname,title:document.title,heading:document.querySelector("main h1")?.innerText,character:!!document.querySelector("#duik-hero-character")})');
  assert.equal(report.navigation.path,'/docs');assert(report.navigation.heading);assert.equal(report.navigation.character,false);
  await screenshot('07-docs-navigation');checks.push('Main navigation CTA reaches the actual Nextra documentation page');
  // Load the one narrow-navigation sample directly at its width. The copied
  // template deliberately reloads across breakpoints; that is a separate concern.
  const narrow=await send('Target.createTarget',{url:'about:blank'},null);
  session=(await send('Target.attachToTarget',{targetId:narrow.targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:720,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});await waitHost();
  await click('.duik-menu-toggle');
  assert.equal(await evaluate('document.querySelector(".duik-menu-toggle").getAttribute("aria-expanded")'),'true');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".duik-nav-links")).display'),'flex');
  await screenshot('06-narrow-navigation');
  await key('Escape',27);
  assert.equal(await evaluate('document.querySelector(".duik-menu-toggle").getAttribute("aria-expanded")'),'false');
  checks.push('One narrow-navigation check: menu opens and Escape closes it');
