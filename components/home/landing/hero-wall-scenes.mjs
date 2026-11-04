/** Original animated feature covers; the existing host owns geometry and drag. */
import {renderWallIllustration} from './hero-wall-art.mjs';
const ROOT_SOURCE_HASH='fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a';
const MODULE_PATH='components/home/landing/hero-wall-scenes.mjs';
const ART_PATH='components/home/landing/hero-wall-art.mjs';
const VERSION='illustrated-fullbleed-v2';
// IDs and routes remain stable; screenshots have been removed from wall covers.
const definitions=[
 ['character-paper','骨骼','/docs/guide/bones','portrait','paper','两段骨骼围绕共享关节联动'],
 ['motion-spacing','动画','/docs/guide/animation','spacing','paper','时间轨迹上的运动间距发生变化'],
 ['controller-symbols','控制器','/docs/guide/controllers','symbols','chalk','目标在控制范围内移动'],
 ['character-autorig','自动绑定','/docs/guide/bones/autorig','controls','sage','骨骼与末端目标联动'],
 ['interpolation-detail','插值','/docs/guide/animation/interpolation','interpolation','sand','沿曲线变化的速度与节奏'],
 ['character-ik','IK / FK','/docs/guide/constraints/kinematics','ik','paper','关节链保持连接并改变姿态'],
 ['layer-detail','图层','/docs/guide/tools/layers','layer-tools','sand','多层画面分离后重新叠合'],
 ['camera-detail','摄像机','/docs/guide/camera','camera','paper','取景框中的前中后景相对移动'],
 ['script-detail','脚本编辑器','/docs/guide/tools/scripting/script-editor','script','chalk','调用与返回的抽象流程'],
 ['constraints-detail','约束','/docs/guide/constraints','constraints','sand','连接关系驱动相邻关节'],
 ['motion-loop','自动化','/docs/guide/automation','loop','paper','沿闭合路径连续运动'],
 ['bones-detail','创建骨骼','/docs/guide/bones/create-bones','bones','chalk','可连接的关节与骨骼结构'],
 ['animation-library','动画库','/docs/guide/animation/anim-library','library','paper','从集合中取出一个动作片段'],
 ['script-library','脚本库','/docs/guide/tools/scripting/library','script-library','sand','从分类中取用一个脚本'],
 ['motion-depth','2D 摄像机','/docs/guide/camera/camera-2d','depth','paper','不同景层以不同幅度移动'],
 ['tool-spectrum','通用工具','/docs/guide/tools','spectrum','sage','分层素材展开并重新组织'],
 ['character-controls','控制器设置','/docs/guide/controllers/tools/settings','expression','paper','目标位置与控制范围的关系'],
 ['wiggle-detail','Wiggle','/docs/guide/automation/wiggle','wiggle','chalk','形状的位置与旋转产生有界抖动'],
 ['composition-detail','合成','/docs/guide/tools/composition/crop','composition','paper','裁剪边界收紧，画面主体位置不变'],
 ['motion-rhythm','序列','/docs/guide/animation/sequence','rhythm','paper','五个形状按时间顺序错峰运动'],
 ['text-detail','文本命名','/docs/guide/tools/text/rename','text','chalk','同一命名前缀加入多个条目'],
 ['command-detail','命令行','/docs/guide/cmd','command','sand','从工具入口到调用的抽象表达'],
].map(([id,title,guide,treatment,tone,meaning])=>({id,title,guide,treatment,tone,meaning}));
const provenance={kind:'original-vector-principle',path:ART_PATH,attribution:'duik-zh original motion illustration',note:'原创动态几何插画；不是 AE 面板、Duik 算法或实际执行结果。'};
const summaries={
 'character-paper':'为分层角色搭建驱动结构。',
 'motion-spacing':'整理关键帧，调整动作节奏。',
 'controller-symbols':'用控制器直接调整角色姿态。',
 'character-autorig':'连接骨骼，建立约束与控制器。',
 'interpolation-detail':'控制动作的加速、减速与停顿。',
 'character-ik':'通过目标或关节调整肢体运动。',
 'layer-detail':'创建、命名和标记图层。',
 'camera-detail':'为平面场景设计镜头运动。',
 'script-detail':'在 AE 中编辑常用脚本。',
 'constraints-detail':'让图层与属性相互驱动。',
 'motion-loop':'用程序化动画减少重复关键帧。',
 'bones-detail':'从肢体结构开始创建骨骼。',
 'animation-library':'保存动作片段，下次接着用。',
 'script-library':'分类收藏，快速找到常用脚本。',
 'motion-depth':'用景层视差表现镜头深度。',
 'tool-spectrum':'处理合成、图层、文本和脚本。',
 'character-controls':'调整控制器的外观与显示。',
 'wiggle-detail':'为属性加入可调节的抖动。',
 'composition-detail':'收紧预合成边界，保持画面位置。',
 'motion-rhythm':'错开图层和动画的时间顺序。',
 'text-detail':'按规则批量整理图层名称。',
 'command-detail':'搜索功能，快速找到工具。',
};
export const heroWallScenes=Object.freeze(definitions.map(def=>Object.freeze({
 id:def.id,title:def.title,summary:summaries[def.id],guide:def.guide,alt:def.title+'文档入口：'+def.meaning+'的动态插画',
 src:`/duik-experience/wall/${def.id}-${VERSION}.svg`,
 reducedMotionSrc:`/duik-experience/wall/${def.id}-${VERSION}.poster.webp`,
 description:def.meaning+'。原创功能原理示意，点击阅读对应的中文文档。',
 sourceReferences:Object.freeze([Object.freeze({...provenance})]),
})));
const escapeXML=value=>String(value).replace(/[<>&"']/g,ch=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[ch]));

/** Publish only generated wall assets; no network access, source art or rig edits. */
export async function publishHeroWallAssets({root=process.cwd(),outputDir}={}){
 const [{default:fs},{default:path},{createHash},{default:sharp},{panels,tools}]=await Promise.all([import('node:fs/promises'),import('node:path'),import('node:crypto'),import('sharp'),import('./tool-catalog.mjs')]);
 const repository=path.resolve(root),destination=path.resolve(repository,outputDir||'public/duik-experience/wall');
 if(destination===repository)throw new Error('Hero wall output must be a dedicated directory.');
 const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
 const [art,docs,moduleBytes,artBytes]=await Promise.all([fs.readFile(path.join(repository,'public/duik-landing-assets/manifest.json'),'utf8').then(JSON.parse),fs.readFile(path.join(repository,'components/home/landing/official-media/sources.json'),'utf8').then(JSON.parse),fs.readFile(path.join(repository,MODULE_PATH)),fs.readFile(path.join(repository,ART_PATH))]);
 // The wall no longer embeds the character. Guard its identity anyway: Hero is unchanged.
 if(art.sourceSha256!==ROOT_SOURCE_HASH||art.rigValidation?.partCount!==26||sha(await fs.readFile(path.join(repository,art.source)))!==ROOT_SOURCE_HASH)throw new Error('Approved character identity or 26-layer contract changed.');
 const assets=[],prepared=[],knownGuides=new Set([...panels,...tools].map(item=>item.href));
 if(definitions.length!==22||new Set(definitions.map(item=>item.id)).size!==22)throw new Error('Hero wall requires 22 unique entries.');
 for(const panel of panels)if(!definitions.some(item=>item.guide===panel.href))throw new Error('Missing primary panel entry: '+panel.id);
 for(const def of definitions){
  if(!knownGuides.has(def.guide))throw new Error('Unknown guide: '+def.guide);
  const stem=path.join(repository,'content',def.guide.slice(1));
  const candidates=await Promise.all([stem+'.mdx',path.join(stem,'index.mdx')].map(async file=>{try{return(await fs.stat(file)).isFile()?file:null}catch{return null}}));
  const document=candidates.find(Boolean);if(!document)throw new Error('Missing local documentation: '+def.guide);
  const scene=heroWallScenes.find(item=>item.id===def.id);
  const references=[{...provenance,sha256:sha(artBytes),meaning:def.meaning}];
  const svg=`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title desc"><title id="title">${escapeXML(def.title)}</title><desc id="desc">${escapeXML(scene.description)}</desc><metadata>${escapeXML(JSON.stringify({id:def.id,sourceReferences:references}))}</metadata>${renderWallIllustration(def.treatment,def.tone)}</svg>`;
  if(/<(?:image|script|foreignObject|animate|animateTransform)\b/i.test(svg)||/(?:href|src)=["'](?:https?:|\/)/i.test(svg))throw new Error('Non-local or non-vector artwork: '+def.id);
  const buffer=Buffer.from(svg),poster=await sharp(buffer).webp({quality:92,effort:5}).toBuffer();
  const reducedMotion={src:scene.reducedMotionSrc,width:800,height:800,format:'webp',bytes:poster.length,sha256:sha(poster)};
  assets.push({...scene,kind:'motion',width:800,height:800,format:'svg',bytes:buffer.length,sha256:sha(buffer),animated:true,reducedMotion,document:path.relative(repository,document),sourceReferences:references});
  prepared.push({filename:path.basename(scene.src),buffer},{filename:path.basename(scene.reducedMotionSrc),buffer:poster});
 }
 const manifest={schemaVersion:2,generator:MODULE_PATH,moduleSha256:sha(moduleBytes),artModuleSha256:sha(artBytes),originalCharacterSha256:ROOT_SOURCE_HASH,officialRevision:docs.revision,canvas:{width:800,height:800},counts:{total:assets.length,primaryPanels:panels.length,approvedCharacter:0,officialDocumentation:0,originalMotionStudies:22,files:prepared.length},principles:['22 original dynamic feature illustrations; original wall geometry and navigation preserved.','Full-bleed geometric compositions, no screenshots, fake UI, raster illustration, or embedded caption strips.','No newly generated character. Approved Hero and shared 26 layers remain untouched.','Self-contained local SVGs and explicit reduced-motion WebP posters.','Cover imagery is conceptual, not AE execution or official Duik algorithm output.'],assets};
 await fs.mkdir(destination,{recursive:true});
 for(const {filename,buffer} of prepared)await fs.writeFile(path.join(destination,filename),buffer);
 await fs.writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
