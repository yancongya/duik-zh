/** Full-bleed, original motion diagrams. No screenshots, fake UI, or new character. */
const P={paper:'#f3f1e8',chalk:'#fbfaf5',olive:'#798569',forest:'#374a3b',orange:'#bd582f',sand:'#dfbb81',ink:'#202724',sage:'#c1c8af'};
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect=(x,y,w,h,fill,r=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line=(d,color=P.forest,width=4,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const diamond=(x,y,size,color)=>`<path d="M${x} ${y-size}l${size} ${size}-${size} ${size}-${size}-${size}Z" fill="${color}"/>`;
const joint=(x,y,r=22)=>circle(x,y,r,P.chalk)+circle(x,y,7,P.orange);
const bone=(length,color=P.forest)=>`<path d="M0 -12L${length} -23V23L0 12Z" fill="${color}"/>`+joint(0,0)+joint(length,0);
const group=(name,body,extra='')=>`<g class="${name}" ${extra}>${body}</g>`;
const smallKeys=(y,offset=0)=>[100,225,400,575,700].map((x,i)=>diamond(x,y,9+i%2*3,i===offset?P.orange:P.olive)).join('');

// Each loop explains a different cause and result. The host suspends the images
// outside the viewport and supplies explicit posters for reduced motion.
export function renderWallIllustration(treatment,tone='paper'){
  let body='',css='';
  const animate=(selector,name,frames,duration='6s',ease='cubic-bezier(.77,0,.175,1)',delay='0s')=>{css+=`@keyframes ${name}{${frames}}${selector}{animation:${name} ${duration} ${ease} ${delay} infinite}`;};
  const panel=(fill=P.chalk)=>rect(94,130,612,540,fill,18);
  const backdrop=P[tone]||P.paper;
  if(treatment==='portrait'){
    body=rect(-20,610,840,220,P.sage)+line('M400 170V620',P.forest,36)+joint(400,200,37)+joint(400,420,32)+joint(400,620,32);
    for(const [i,angle] of [[0,-155],[1,-25]]){body+=`<g transform="translate(400 300) rotate(${angle})">${group('branch-'+i,bone(205,P.olive))}</g>`;animate('.branch-'+i,'branch-'+i,'0%,100%{transform:rotate(-8deg)}50%{transform:rotate(12deg)}','7s');}
    for(const angle of [42,138])body+=`<g transform="translate(400 545) rotate(${angle})">${bone(225,P.orange)}</g>`;
  }else if(treatment==='bones'){
    body=rect(-20,605,840,240,P.sage);
    for(let i=0;i<3;i++){body+=`<g transform="translate(${215+i*185} 565) rotate(-90)">${group('assemble-'+i,bone(340,[P.forest,P.olive,P.orange][i]))}</g>`;animate('.assemble-'+i,'assemble-'+i,'0%,100%{transform:translateX(0)}45%,65%{transform:translateX(90px)}','6s','cubic-bezier(.23,1,.32,1)',(-i*.3)+'s');}
    body+=line('M125 150H675',P.olive,3,'stroke-dasharray="5 13"');
  }else if(treatment==='controls'){
    body=rect(-20,600,840,230,P.sand)+circle(400,400,230,'none',`stroke="${P.sage}" stroke-width="64"`);
    for(let i=0;i<4;i++)body+=`<g transform="translate(400 400) rotate(${45+i*90})">${group('bind-'+i,bone(225,i%2?P.orange:P.forest))}</g>`;
    body+=joint(400,400,46);
    for(let i=0;i<4;i++)animate('.bind-'+i,'bind-'+i,'0%,100%{transform:rotate(-12deg)}45%,65%{transform:rotate(12deg)}','7s');
  }else if(treatment==='constraints'){
    body=rect(-20,640,840,190,P.sage)+line('M80 150H720',P.forest,12);
    for(let i=0;i<4;i++){const x=160+i*160;body+=`<g transform="translate(${x} 150)">${group('pendulum-'+i,line('M0 0V310',P.olive,5)+circle(0,360,80,i%2?P.orange:P.forest))}</g>`;animate('.pendulum-'+i,'pendulum-'+i,`0%,100%{transform:rotate(${i===0?22:0}deg)}50%{transform:rotate(${i===3?-22:0}deg)}`,'5s');}
  }else if(treatment==='ik'){
    // Two nested rigid links: their shared pivot stays connected throughout.
    const reversed=treatment==='constraints',length=treatment==='portrait'?235:240;
    body=rect(-60,575,920,280,P.sage)+line('M-40 576H840',P.olive,2);
    body+=line('M140 510Q370 100 660 430',P.olive,2,'stroke-dasharray="5 15"');
    const tip=group('tip',bone(205,P.orange)+rect(175,-30,60,60,'none',7,`stroke="${P.orange}" stroke-width="3"`),'style="transform:rotate(58deg)"');
    body+=`<g transform="translate(155 495)">${group('upper',bone(length)+`<g transform="translate(${length} 0)">${tip}</g>`,'style="transform:rotate(-43deg)"')}</g>`;
    body+=circle(155,495,44,'none',`stroke="${P.forest}" stroke-width="2"`);
    body+=group('target',circle(603,333,50,'none',`stroke="${P.orange}" stroke-width="3"`)+line('M603 263v26m0 88v26m-70-70h26m88 0h26',P.orange,3));
    if(reversed)body+=line('M180 678H610',P.forest,6)+[180,395,610].map(x=>joint(x,678)).join('');
    animate('.upper','upper','0%,100%{transform:rotate(-43deg)}50%{transform:rotate(-65deg)}','7s');
    animate('.tip','tip','0%,100%{transform:rotate(58deg)}50%{transform:rotate(98deg)}','7s');
    animate('.target','target','0%,100%{opacity:.25}40%,60%{opacity:.9}','7s');
  }else if(treatment==='expression'){
    body=rect(-20,0,840,180,P.sage)+circle(400,435,220,P.paper)+circle(400,435,165,'none',`stroke="${P.forest}" stroke-width="14"`);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,x=400+Math.cos(a)*165,y=435+Math.sin(a)*165;body+=group('setting-'+i,rect(x-32,y-32,64,64,P.orange,12));animate('.setting-'+i,'setting-'+i,`0%,100%{transform:translate(0,0)}50%{transform:translate(${Math.cos(a)*60}px,${Math.sin(a)*60}px)}`,'7s');}
    body+=line('M365 435H435M400 400V470',P.olive,6);
  }else if(treatment==='symbols'){
    body=rect(-60,-20,920,280,P.sage)+rect(-60,620,920,240,P.sand);
    body+=line('M125 400H675M400 125V675',P.olive,3);
    body+=circle(400,400,215,'none',`stroke="${P.forest}" stroke-width="52"`)+circle(400,400,142,P.chalk);
    body+=group('puck',circle(400,400,71,P.orange)+line('M373 400H427M400 373V427',P.chalk,5));
    body+=group('orbit',diamond(400,185,26,P.sand),'style="transform-origin:400px 400px"');
    animate('.puck','puck','0%,100%{transform:translate(-70px,18px)}30%{transform:translate(50px,-50px)}65%{transform:translate(80px,55px)}','8s');
    animate('.orbit','orbit','to{transform:rotate(360deg)}','16s','linear');
  }else if(treatment==='spacing'){
    body=rect(-20,600,840,230,P.sage)+line('M-20 400H820',P.olive,3);
    [65,125,225,370,545,745].forEach((x,i)=>{body+=circle(x,400,14+i*6,P.sage)+line(`M${x} 575v50`,P.olive,3);});
    body+=group('traveller',circle(120,400,120,P.orange)+circle(120,400,48,P.sand));
    animate('.traveller','travel','0%,100%{transform:translateX(0)}45%,60%{transform:translateX(560px)}','6s');
  }else if(treatment==='interpolation'){
    body=rect(-10,560,820,250,P.sand);
    body+=line('M55 570H755M90 650V140',P.olive,2);
    const curve=treatment==='spacing'?'M90 570C370 570 465 160 710 160':'M90 570C470 570 220 160 710 160';
    body+=line(curve,P.forest,26)+line('M90 570L350 570M710 160L450 160',P.olive,3);
    body+=circle(350,570,12,P.orange)+circle(450,160,12,P.orange)+smallKeys(685);
    for(let i=0;i<5;i++)body+=group('curve-dot dot-'+i,circle(90,570,34-i*3,i?P.sage:P.orange));
    for(let i=0;i<5;i++)animate('.dot-'+i,'curve-'+i,'0%,100%{transform:translate(0,0)}25%{transform:translate(200px,-70px)}50%,60%{transform:translate(620px,-410px)}','6s','cubic-bezier(.77,0,.175,1)',(-i*.12)+'s');
  }else if(treatment==='spectrum'){
    body=rect(0,0,400,400,P.sage)+rect(400,400,400,400,P.sand);
    body+=group('tool-orbit',circle(210,210,100,'none',`stroke="${P.forest}" stroke-width="44"`)+circle(210,110,27,P.orange),'style="transform-origin:210px 210px"');
    body+=group('tool-crop',rect(480,90,240,240,'none',0,`stroke="${P.orange}" stroke-width="16"`),'style="transform-origin:600px 210px"');
    body+=line('M150 510L60 600L150 690M260 510L350 600L260 690',P.forest,27);
    body+=group('tool-layers',rect(470,505,240,150,P.olive,12)+rect(500,465,240,150,P.chalk,12));
    animate('.tool-orbit','tool-orbit','to{transform:rotate(360deg)}','12s','linear');
    animate('.tool-crop','tool-crop','0%,100%{transform:scale(1)}50%{transform:scale(.68)}','7s');
    animate('.tool-layers','tool-layers','0%,100%{transform:translateY(0)}50%{transform:translateY(-48px)}','7s');
  }else if(treatment==='layer-tools'){
    const shape=`<g transform="rotate(-25 400 400) skewY(10)">${rect(145,180,510,440,P.forest,14)}${group('sheet-back',rect(145,180,510,440,P.olive,14))}${group('sheet-front',rect(145,180,510,440,P.chalk,14)+circle(400,400,140,P.orange)+circle(400,400,57,P.sand))}</g>`;
    body=shape;css+='.sheet-back{transform:translate(-20px,-45px)}.sheet-front{transform:translate(20px,-95px)}';
    animate('.sheet-back','sheet-back','0%,100%{transform:translate(0,0)}45%,65%{transform:translate(-35px,-75px)}','7s');
    animate('.sheet-front','sheet-front','0%,100%{transform:translate(0,0)}45%,65%{transform:translate(35px,-160px)}','7s');
  }else if(treatment==='camera'||treatment==='depth'){
    // Three true planes of a flat graphic composition, not an imitation UI.
    body=group('far',rect(-100,0,1000,800,P.sage)+circle(590,220,185,P.sand));
    body+=group('mid',rect(-60,400,360,460,P.paper,170)+rect(230,170,360,730,P.paper,180)+rect(315,310,190,590,P.orange,95));
    body+=group('near',rect(-90,660,1000,240,P.forest)+circle(710,620,180,P.forest));
    body+=line('M110 235V150H200M600 150H690V235M690 565V650H600M200 650H110V565',P.chalk,9);
    for(const [name,amount] of [['far',14],['mid',43],['near',85]])animate('.'+name,'depth-'+name,`0%,100%{transform:translateX(-${amount}px)}50%{transform:translateX(${amount}px)}`,'8s');
  }else if(treatment==='loop'){
    body=circle(400,400,245,'none',`stroke="${P.forest}" stroke-width="118"`)+circle(400,400,90,P.sage);
    body+=group('orbit',circle(400,155,73,P.orange)+diamond(400,155,23,P.paper),'style="transform-origin:400px 400px"');
    body+=group('reverse-orbit',circle(400,645,32,P.sand),'style="transform-origin:400px 400px"');
    animate('.orbit','orbit','to{transform:rotate(360deg)}','9s','linear');
    animate('.reverse-orbit','counter','to{transform:rotate(-360deg)}','18s','linear');
  }else if(treatment==='wiggle'){
    body=rect(-50,580,900,260,P.sand)+line('M40 580H760',P.olive,2);
    const wave=Array.from({length:43},(_,i)=>`${i?'L':'M'}${-20+i*20} ${400+Math.sin(i*.65)*90+Math.sin(i*1.1)*35}`).join('');
    body+=line(wave,P.forest,16);
    body+=group('wiggle',rect(288,288,224,224,P.orange,22)+circle(400,400,65,P.chalk),'style="transform-origin:400px 400px"');
    animate('.wiggle','wiggle','0%,100%{transform:translate(0,0) rotate(0deg)}20%{transform:translate(-38px,-55px) rotate(-9deg)}45%{transform:translate(32px,48px) rotate(8deg)}70%{transform:translate(-23px,28px) rotate(-5deg)}','4.8s');
  }else if(treatment==='rhythm'){
    body=rect(-10,590,820,220,P.sage)+line('M60 590H740',P.olive,3);
    for(let i=0;i<5;i++){body+=group('beat beat-'+i,rect(70+i*140,220,100,370,[P.forest,P.olive,P.orange,P.sand,P.chalk][i],50));body+=diamond(120+i*140,675,12,P.forest);animate('.beat-'+i,'beat-'+i,'0%,20%,100%{transform:translateY(0)}45%,65%{transform:translateY(-135px)}','6s','cubic-bezier(.77,0,.175,1)',(-i*.3)+'s');}
  }else if(treatment==='composition'){
    body=rect(70,90,660,620,P.sage,14)+rect(150,170,500,460,P.paper)+circle(400,400,160,P.orange)+circle(400,400,76,P.sand);
    body+=group('crop-frame',rect(150,170,500,460,'none',0,`stroke="${P.forest}" stroke-width="10"`)+[150,650].flatMap(x=>[170,630].map(y=>rect(x-13,y-13,26,26,P.chalk,0,`stroke="${P.forest}" stroke-width="4"`))).join(''),'style="transform-origin:400px 400px"');
    animate('.crop-frame','crop','0%,100%{transform:scale(1.24)}45%,70%{transform:scale(.8)}','6.5s');
  }else if(treatment==='script-library'){
    body=rect(-20,630,840,220,P.sage);
    for(let i=0;i<3;i++){const x=105+i*210;body+=group('snippet-'+i,rect(x,150,175,490,[P.forest,P.olive,P.orange][i],16)+line(`M${x+65} 325l-30 30 30 30m45-60 30 30-30 30`,P.chalk,9));animate('.snippet-'+i,'snippet-'+i,'0%,100%{transform:translateY(0)}45%,65%{transform:translateY(-80px)}','7s','cubic-bezier(.77,0,.175,1)',(-i*.6)+'s');}
  }else if(treatment==='library'){
    body=rect(-50,570,900,260,P.sage)+line('M30 570H770',P.forest,4);
    for(let i=0;i<3;i++){const x=100+i*204;body+=group('volume-'+i,rect(x,195,174,375,[P.forest,P.olive,P.orange][i],16)+line(`M${x+28} 255H${x+146}`,P.chalk,4)+circle(x+87,398,46,P.sand));}
    body+=group('extract',rect(304,195,174,375,P.chalk,16)+diamond(391,395,55,P.orange));
    animate('.extract','extract','0%,100%{transform:translateY(0)}45%,70%{transform:translateY(-130px)}','7s');
  }else if(treatment==='command'){
    body=rect(-20,625,840,225,P.sage)+line('M125 260H675M125 400H675M125 540H675',P.olive,3);
    for(let i=0;i<3;i++)body+=diamond(190,260+i*140,30,P.forest)+rect(265,242+i*140,350,36,i===1?P.orange:P.sage,18);
    body+=group('choice',rect(105,201,590,118,'none',16,`stroke="${P.orange}" stroke-width="6"`));
    animate('.choice','choose','0%,100%{transform:translateY(0)}35%,55%{transform:translateY(140px)}70%,85%{transform:translateY(280px)}','7s');
  }else if(treatment==='script'){
    body=rect(-30,600,860,230,P.sage)+line('M80 600H720',P.olive,3);
    body+=group('code-left',line('M255 235L90 400L255 565',P.forest,46));
    body+=group('code-right',line('M545 235L710 400L545 565',P.forest,46));
    body+=group('call',rect(345,275,110,250,P.orange,55,'transform="rotate(18 400 400)"'));
    body+=group('return',circle(400,400,54,P.sand));
    animate('.code-left','code-left','0%,100%{transform:translateX(0)}45%,65%{transform:translateX(42px)}','6s');
    animate('.code-right','code-right','0%,100%{transform:translateX(0)}45%,65%{transform:translateX(-42px)}','6s');
    animate('.return','return','0%,20%,100%{opacity:0;transform:translateY(130px)}45%,65%{opacity:1;transform:translateY(0)}','6s');
  }else if(treatment==='text'){
    // Letterforms are actual geometry. The shared prefix joins three name items.
    body=rect(-50,0,900,170,P.sage)+rect(-50,630,900,220,P.sand);
    for(let i=0;i<3;i++){const y=250+i*135;body+=line(`M360 ${y}H660`,P.forest,24)+line(`M360 ${y+38}H${[560,620,495][i]}`,P.olive,10);body+=group('prefix-'+i,line(`M140 ${y+45}l40-80 40 80M155 ${y+15}h50`,P.orange,13));animate('.prefix-'+i,'prefix-'+i,'0%,10%,100%{opacity:.18;transform:translateX(-90px)}45%,75%{opacity:1;transform:translateX(0)}','6s','cubic-bezier(.23,1,.32,1)',(-i*.2)+'s');}
  }else throw new Error('Unknown wall illustration: '+treatment);
  return `<path fill="${backdrop}" d="M0 0H800V800H0Z"/><style>@media(prefers-reduced-motion:no-preference){${css}}</style>${body}`;
}
