// Source: local Chinese introduction/install guides and docs/GLOSSARY.md.
// Only existing string slots are changed; serialized Nuxt references stay intact.
export const headlineActors=['角色动画','动态图形','日常创作'].map(name=>({name,avatar:'/duik-landing-assets/expression-detail.webp'}));
export const headlineWords=['在','中，用','打磨'];
export const headlineSummary='在角色动画、动态图形和日常创作中，用 Duik 工具打磨创意与细节。';
export const headlineTools=[
  {name:'绑定工具',icon:'ic-settings',tint:'255 107 43',assets:[{label:'动作细节',icon:'ic-people',prompt:''},{label:'角色表演',icon:'ic-settings',prompt:''}]},
  {name:'动画工具',icon:'ic-link',tint:'255 176 116',assets:[{label:'运动节奏',icon:'ic-people',prompt:''},{label:'角色表演',icon:'ic-play',prompt:''}]},
  {name:'效率工具',icon:'ic-play',tint:'255 213 157',assets:[{label:'创意表达',icon:'ic-play',prompt:''},{label:'最终效果',icon:'ic-settings',prompt:''}]}
];
// The captured Hero renders its final phase title separately from the fixed
// headline suffix. Keep the two in one contract so they cannot form two slogans.
export const heroWallIntro={
  suffix:'都能更顺手。',
  phases:[
    {title:'角色绑定',description:'搭好骨骼，用控制器调整姿态。'},
    {title:'动画制作',description:'调整关键帧，让动作更有节奏。'},
    {title:'日常创作',description:'合成、图层和脚本，常用操作少几步。'},
  ],
};
export const textSlots = {
  9:'不止绑定，让 After Effects 工作更顺手。',36:'查看安装与入门指南',37:heroWallIntro.phases.at(-1).title+'\n'+heroWallIntro.suffix,38:'向下了解 Duik 的主要面板与工作方式',
  39:'Duik Ángela 是运行在 After Effects 中的脚本工具集。这里提供非官方中文指南，帮助你了解绑定、动画、自动化，以及合成、图层和脚本工具。',
  265:'',269:'',272:'',277:'阅读中文文档',280:'查看安装方法',
  284:heroWallIntro.phases[0].title,287:heroWallIntro.phases[1].title,290:heroWallIntro.phases[2].title,
  294:heroWallIntro.phases[0].description,297:heroWallIntro.phases[1].description,300:heroWallIntro.phases[2].description,
  303:'角色绑定流程',304:'从分层素材，到可控制的动作。',
  309:'拆层与骨骼',311:'准备独立的角色图层，为关节安排合适的锚点，再用骨骼组织肢体结构。',
  314:'绑定与约束',315:'连接美术层与骨骼，设置自动绑定和约束。通过控制器试着调整姿势，检查关节的运动关系。',
  318:'进入动画',319:'用关键帧安排姿态和节奏，再按需要使用动画与自动化工具。保留结构，继续打磨角色表演。',
  323:'自动化与控制权',324:'自动绑定之后，动作仍由你掌控。',325:'Duik 提供自动绑定，也开放骨骼、约束与控制器等底层工具。**按照角色需要调整结构和动作。**',
  331:'先建立驱动结构',332:'骨骼与约束，明确每个关节的关系',335:'再完成角色表演',336:'通过控制器调整姿态与动作节奏',
  343:'动画与关键帧',344:'路径相同，\n节奏由你决定。',345:'调一调插值，让动作轻快出发、从容停下。路径不变，感觉不同。',
  351:'自动化与表达式',352:'设定规则，\n让运动持续发生。',353:'从轻微晃动到持续变化，用幅度和频率调整运动，不必逐帧重复。',
  358:'摄像机与场景',359:'从一个角色，\n走进整个画面。',360:'把画面分成远近层次。移动视点，让前景与背景错开，平面也有空间感。',
  363:'复用与整理',364:'把做好的，\n留给下一次',402:'创作。',
  408:'复用结构',410:'从 OCO 元绑定开始，调整骨架，接着创作。',413:'收藏动作',414:'把调好的动画收进库，下次从喜欢的节奏开始。',417:'整理脚本',418:'分类和收藏常用脚本，把熟悉的工具放在手边。',421:'留下笔记',422:'为工程写下提示，重新打开时也能接上思路。',425:'检查工程',426:'用自检工具查看工程状态，再继续手上的工作。',
  648:'学习路径',649:'从你现在的工作阶段开始。',650:'先完成安装，再理解角色结构；已经有绑定的角色，可以直接查阅动画工具。',
  658:'Duik 只是角色绑定工具吗？',657:'不只是。除了骨骼、约束和控制器，Duik 还提供动画、自动化与表达式、摄像机，以及合成、图层、文本、脚本等通用工具，并有命令面板与 API 入口。',
  663:'我需要先掌握 After Effects 吗？',662:'需要。建议先熟悉关键帧、插值、父子关系和表达式基础，再学习 Duik 的绑定流程。',
  667:'自动绑定后还能手动调整吗？',666:'可以。Duik 允许访问自动流程使用的底层工具，你可以按角色需要调整骨骼、约束和控制器。',
  671:'这个网页可以代替 Duik 吗？',670:'首页角色是有限幅度的网页交互示意，用来体验控制器。实际的 Duik 绑定和动画工作仍在 After Effects 内完成。',
  675:'角色素材应该怎样准备？',674:'将需要独立运动的部分组织成清楚的图层，并检查关节、锚点及遮挡关系。先阅读骨骼与角色准备相关文档。',
  679:'可以只使用其中一部分工具吗？',678:'可以。Duik 支持按需要使用底层工具，也提供可选的独立 ScriptUI 面板。安装指南介绍了这些选择。',
  683:'绑定完成的项目必须一直安装 Duik 吗？',682:'根据 Duik 简介，已完成的绑定可以在未安装 Duik 的 After Effects 实例中打开并制作动画。项目中的其他插件和素材仍需自行确认。',
  687:'可以通过脚本扩展工作流程吗？',686:'Duik 提供 API 和开源实现，可供有开发经验的使用者集成或扩展工具。请从 API 文档开始。',
  691:'应该从哪里获取 Duik？',690:'请前往 RxLaboratory 官方页面获取软件，再参照安装指南操作。本站不提供安装包镜像。',
  695:'这个中文站是官方站点吗？',694:'不是。本站是 Duik Ángela 的非官方中文文档站。软件归属 RxLaboratory，翻译文档保留上游署名并依据 GFDL 1.3 发布。',
  699:'支持哪些 After Effects 版本？',698:'兼容要求请查看安装指南，并以官方发布说明为准。首页不单独承诺持续变化的版本范围。',
  700:'常见问题',701:'开始之前，你可能想知道。',708:'更多操作细节与排错方法，请查阅 ',713:'中文常见问题',718:'/docs/faq',
  725:'从具体问题，\n找到下一步。',726:'选择你正在处理的任务，进入对应的工具指南。',
  736:'Duik Ángela 中文指南｜绑定、动画与效率工具',737:'Duik Ángela 非官方中文文档',739:'Duik Ángela 非官方中文指南：认识 After Effects 中的绑定、动画、自动化、摄像机、合成与图层工具，以及脚本 API。',
};

export const learningMarkup=`<div class="duik-section-intro"><p class="duik-eyebrow">学习路径</p><h2>从你现在的工作阶段开始。</h2><p>找到需要的文档，再回到 After Effects 动手试一试。</p></div><div class="duik-path-cards">
<a href="/docs/getting-started/install" class="duik-path-card"><span class="duik-step">01 / 安装</span><h3>先把工具准备好。</h3><p>从官方获取 Duik，安装 ScriptUI 面板，完成首次运行设置。</p><ul><li>官方软件下载入口</li><li>安装与面板停靠</li><li>脚本权限与语言设置</li></ul><span class="duik-card-link">查看安装指南 ↗</span></a>
<a href="/docs/guide/bones" class="duik-path-card"><span class="duik-step">02 / 绑定</span><h3>让结构能够驱动角色。</h3><p>理解骨骼、自动绑定与约束，再用控制器检验关节的运动。</p><ul><li>骨骼与美术层</li><li>自动绑定与约束</li><li>控制器与姿态调整</li></ul><span class="duik-card-link">开始学习绑定 ↗</span></a>
<a href="/docs/guide/animation" class="duik-path-card"><span class="duik-step">03 / 动画</span><h3>把姿势连成表演。</h3><p>角色已经完成绑定？从关键帧、插值与动画工具继续推进。</p><ul><li>关键帧与插值</li><li>循环与自动化工具</li><li>摄像机与场景运动</li></ul><span class="duik-card-link">查阅动画工具 ↗</span></a></div>`;
export const navMarkup=`<nav class="duik-site-nav" aria-label="主导航"><a class="duik-wordmark" href="/">Duik <span>Ángela</span><small>中文指南</small></a><div class="duik-nav-links"><a href="#inside-ae">认识 Duik</a><a href="#workflow">角色绑定</a><a href="#tools">通用工具</a><a href="#toolkit">工具总览</a><a href="#api">脚本 API</a><a href="/docs/getting-started/install">安装指南</a></div><a class="duik-primary duik-nav-cta" href="/docs">阅读中文文档 ↗</a><button class="duik-menu-toggle" type="button" aria-expanded="false" aria-label="展开导航">菜单</button></nav>`;
export const heroRibbon = Object.freeze({
  href:'/docs/getting-started/first-look',
  label:'认识八个主面板',
  icon:'/duik-experience/icons/tools.svg',
  pause:'暂停流动',
});
export const footerMarkup=`<div class="duik-footer-content"><div><p class="duik-eyebrow">继续学习 DUIK ÁNGELA</p><h2>让工具处理重复，<br>把时间留给创作。</h2><div class="duik-footer-actions"><a class="duik-primary" href="/docs">阅读中文文档 ↗</a><a class="duik-secondary" href="https://rxlaboratory.org/tools/duik-angela/" target="_blank" rel="noopener noreferrer">官方获取软件 ↗</a></div></div><div class="duik-footer-links"><a href="/docs/getting-started/introduction">认识 Duik</a><a href="#toolkit">八大功能面板</a><a href="/docs/guide/tools">通用工具指南</a><a href="/docs/advanced/api/getting-started">脚本 API 入门</a><a href="/docs/faq">常见问题</a><a href="/docs/misc/credits">上游致谢</a></div><div class="duik-legal"><p>本站是 Duik Ángela 的非官方中文文档站。软件由 RxLaboratory 开发；本站不提供安装包镜像。</p><p>上游文档与图标：Nicolas “Duduf” Dufresne 与贡献者 · 译文依据 <a href="/docs/misc/doc-license">GFDL 1.3</a> 发布。</p><a href="#">返回顶部 ↑</a></div></div>`;
