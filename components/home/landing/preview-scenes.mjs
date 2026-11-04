// Original deterministic SVG scene art, not screenshots of an AE session.
// UI diagrams stay local; the approved character and its pixels are untouched.
const base=(title,body)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360" role="img" aria-label="'+title+'"><rect width="400" height="360" rx="16" fill="#f5f3eb"/><g fill="none" stroke="#d4d8ca" stroke-width="1"><path d="M32 56H368M32 302H368"/></g><text x="32" y="36" font-family="sans-serif" font-size="13" fill="#545f47">'+title+'</text>'+body+'<text x="32" y="331" font-family="sans-serif" font-size="10" fill="#7b8173">Duik 中文指南 · 功能示意</text></svg>';
const art=[
  ['layers','图层与管理','<g stroke="#aeb79e" fill="#e4e9dc"><path d="M77 140 200 88 323 140 200 192Z"/><path d="M77 181 200 129 323 181 200 233Z"/><path d="M77 222 200 170 323 222 200 274Z"/></g><path d="M77 140 200 88 323 140 200 192Z" fill="#d9e4c6" stroke="#708a50" stroke-width="2"/><g fill="#53633d" font-family="sans-serif" font-size="12"><text x="180" y="148">美术层</text><text x="180" y="222">骨骼层</text><text x="180" y="262">控制层</text></g><circle cx="200" cy="140" r="5" fill="#ba5635"/>'],
  ['animation','关键帧与节奏','<path d="M54 254V86M54 254H348" stroke="#bcc3b1" fill="none"/><path d="M54 254C155 254 211 88 348 88" stroke="#ba5635" stroke-width="4" fill="none"/><path d="M54 254 348 88" stroke="#b9bdaa" stroke-dasharray="4 6" fill="none"/><path d="M54 276H348M190 76V284" stroke="#a2ae8e" fill="none"/><g fill="#ba5635"><path d="M54 270 60 276 54 282 48 276Z"/><path d="M190 270 196 276 190 282 184 276Z"/><path d="M348 270 354 276 348 282 342 276Z"/></g><circle cx="190" cy="178" r="8" fill="#f5f3eb" stroke="#ba5635" stroke-width="3"/>'],
  ['automation','自动化与表达式','<g fill="none" stroke="#c9d1be"><path d="M40 180H360M80 90V270M160 90V270M240 90V270M320 90V270"/></g><path d="M40 180C70 65 110 65 140 180S210 295 240 180 310 65 340 180" fill="none" stroke="#7b765e" stroke-width="3"/><g fill="#dce4ce" stroke="#829b61" stroke-width="2"><circle cx="80" cy="110" r="20"/><rect x="164" y="219" width="36" height="36" rx="5"/><path d="m286 94 24 42-48 0Z"/></g><text x="126" y="287" font-family="monospace" font-size="12" fill="#675f50">amplitude × frequency</text>'],
  ['composition','合成与通用工具','<rect x="40" y="80" width="320" height="208" fill="#e6e8df" stroke="#b6c0a8"/><rect x="95" y="113" width="210" height="145" fill="#f8f7f0" stroke="#a75a38" stroke-width="2" stroke-dasharray="5 5"/><path d="M173 113V258M95 185H305" stroke="#dedfd3"/><circle cx="200" cy="185" r="36" fill="#c3d0af"/><path d="M190 185H210M200 175V195" stroke="#6a7854" stroke-width="2"/><path d="M85 130V103H112M288 103H315V130M85 241V268H112M288 268H315V241" fill="none" stroke="#b94c30" stroke-width="3"/>'],
  ['camera','摄像机与构图','<rect x="42" y="80" width="316" height="210" rx="4" fill="#eef0e4" stroke="#b9c6a5"/><circle cx="282" cy="128" r="22" fill="#e0c4a0"/><path d="m42 244 87-94 78 94 71-57 80 57V290H42Z" fill="#d8e1c9"/><path d="M42 270 146 207 221 255 274 214 358 260V290H42Z" fill="#adbf93"/><path d="M42 290 116 255 200 280 290 247 358 279V290Z" fill="#6f8a59"/><path d="M116 80V290M284 80V290M42 150H358M42 220H358" stroke="#f8f7ef" stroke-opacity=".8"/><path d="M191 185H209M200 176V194" stroke="#52653f" stroke-width="2"/>'],
  ['api','脚本与 API','<path d="M99 110H83V250H99M301 110H317V250H301" fill="none" stroke="#9eae87" stroke-width="3"/><text x="113" y="151" font-family="monospace" font-size="15" fill="#727d64">// AE ExtendScript</text><text x="113" y="190" font-family="monospace" font-size="17" fill="#a95236">Duik.Rig.arm();</text><text x="113" y="227" font-family="sans-serif" font-size="12" fill="#6f795f">引入 API → 初始化 → 调用</text>'],
];
export const vectorPreviews=art.map(([id,title,body])=>({id,title,alt:title+'的原创矢量示意',src:'/duik-experience/previews/'+id+'.svg',svg:base(title,body)}));

// Hero cards show real Duik panels; vector art remains available only as labelled illustrations.
export const heroPreviews=[
 ["bones","骨骼与结构","bones/bones_panel.png"],
 ["controllers","控制器","controllers/panel.png"],
 ["animation","动画与关键帧","animation/animation-panel.png"],
 ["tools","合成与图层工具","tools/layer-tools.png"],
 ["automation","自动化与表达式","automation/panel.png"],
 ["scripts","脚本与 API","tools/script-editor.png"],
].map(([id,title,file])=>({id,title,alt:title+" · Duik 官方文档面板原图",src:"/duik-experience/official/duik/"+file,sourceFile:"duik/"+file}));
