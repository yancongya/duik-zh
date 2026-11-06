# AGENTS.md — 给 AI agent 的协作指南

本文件供在本仓库工作的 agent（Claude / Codex 等）快速对齐上下文。人类贡献者同样适用。

## 项目是什么

`duik-zh`：Duik Ángela（AE 绑定动画工具）的**非官方中文文档站**。
- 技术栈已锁定：**Nextra 4 + Next.js App Router**，不要提议换栈（VitePress/Docusaurus/Hugo 等一律拒绝）。
- 内容源已锁定：上游 GitHub `RxLaboratory/Duik` 的 `src-docs/docs/**/*.md` + `src-docs/mkdocs.yml`。**禁止爬取 duik.org 的 HTML。**
- 方案真身在 [`PLAN.md`](./PLAN.md)。动手前先读 PLAN §2（架构）、§3（同步）、§5（汉化）、§7（风险）。

## 硬规则（违反即返工）

1. **不覆盖已翻译内容**：`content/docs/**` 下已存在的文件（`translation-manifest.json` 中 status ≠ `untranslated`）永不被脚本/agent 用上游英文覆盖。
2. **不改上游快照**：`upstream/` 目录只读，由 CI 刷新；本地改动无效。
3. **协议合规**：译文以 GFDL 1.3 分发。每篇文档保留上游版权声明；不要删除 footer/meta 的归属信息；仓库根的 `NOTICE.md`、`LICENSE-GFDL-1.3.md` 不要删。
4. **术语一致**：新增/修改译文前查 [`docs/GLOSSARY.md`](./docs/GLOSSARY.md)。术语表没有的词，按 TRANSLATING.md 的仲裁顺序处理，并提议回写术语表。
5. **不做**：不提供安装包镜像；不伪装官方；不整站机翻直发（机翻只能作初稿，必须过术语与审校）；不把个人笔记混进 `content/docs/` 镜像树（个人内容放 `content/notes/`）。

## 目录职责

| 路径 | 职责 | agent 可否改 |
|---|---|---|
| `app/` | 路由与页面壳 | 可改（首页/文档壳） |
| `components/home/` | 首页区块 | 可改 |
| `content/docs/**` | 文档正文（翻译产出） | 可改（遵守不覆盖规则） |
| `content/_meta.cn.json` | 中文导航标题真源，生成 `content/docs/**/_meta.js` | 可改 |
| `scripts/` | 同步/转换脚本 | 可改 |
| `upstream/` | 上游快照 | **只读** |
| `docs/` | 协作文档 | 可改 |
| `.github/workflows/` | CI | 可改 |

## 常用命令

当前工作区可能为稀疏检出：`upstream/`、根许可证或 NOTICE 本地缺席时，先用 `git ls-files -v -- <path>` 区分 skip-worktree 与真正缺文件；不要因此重建、覆盖或删除已追踪内容。

```bash
npm install
npm run dev        # 本地预览
npm run build      # 构建验证（改完必须跑）
npm run sync       # 盘点上游 → sync-report.json + translation-manifest.json
npm run nav        # mkdocs.yml → content/docs/_meta.ts
npm run convert    # 上游 md → 占位 mdx（跳过已存在文件）
```

## 典型任务流程

- **翻译一页**：确认 `content/docs/<path>.mdx` 不存在或为占位 → `npm run convert` 生成 → 按 GLOSSARY 翻译 → 更新 `translation-manifest.json`（status: translated，记录 upstreamHash）→ `npm run build`。
- **处理 stale**：manifest 中该页 `stale: true` → 对比 `upstream/docs/<path>.md` 与现译文 → 只重译变更段 → 清 stale。
- **上游结构变更**：`npm run nav` 后 diff `_meta.ts` → 报告重命名建议，**不要**自动 `git mv` 翻译文件。
- **落地页改版**：先确认真实运行入口。当前 `/` 经 Next rewrite 显示 `public/landing.html`，可编辑真源在 `components/home/landing/`，通过 `npm run landing:publish` 同步；仅修改 `app/page.tsx` 不会改变当前落地页。不碰 `content/docs/`，不直接手改生成文件。

### 文档壳与路由

- **GitHub Pages（2026-11-06）。** 用户选择本仓库 Pages，授权本次修复三个未推送提交、推送与部署；后续仍不自动推送。`build:pages`在临时树编译，`/duik-zh/`为项目基路径，Actions发布`out/`；不要改为`docs/`分支源。素材路径在临时源码编译前适配，禁止替换生成的Next Flight内容（字节长度会损坏）。首页代理仅转为已有本地文件，完整Nuxt/GSAP/26层核心不变；Nextra返回首页用完整导航而非Next Link。Pagefind在导出后索引article，`test:pages`和构建引用/Flight完整性验证为门槛。普通3017运行不变；发布与本地验收边界见`docs/GITHUB_PAGES.md`。只推`main`，不要推保留原误报历史的`codex/pre-pages-20261106`。

- **文档媒体交付（2026-11-06）。** `npm run docs:media` 在 dev/build 前检查真实 MDX 图片引用和文件签名；缺失资源不得 rewrite 为 HTTP 200 占位 SVG。先用 `git ls-files -v` 区分稀疏省略和真实缺失；扩展 sparse 时保留完整 `public/**`、`scripts/**`、`components/docs/**`、`patches/**` 和根配置，不得使现有运行时被重新稀疏移除。媒体问题不通过覆盖译文或上游快照修复。
- **外部媒体边界。** `components/docs/image-policy.mjs` 仅记录已核实的同素材精确迁移；保留原译文、caption与归属。视频核查仅请求正文已记录的原地址，状态存于 `video-status.json`；403/404/410提供官方入口与重试，超时不当永久失效。课程访问限制不得绕过/镜像；可用提示不等于站内播放恢复。维护命令与证据见 `docs/DOCS_MEDIA_DELIVERY.md`。
- `content/docs` 已含 `/docs` 层级，根 catch-all 使用 `contentDirBasePath: '/'`，侧栏取 `getPageMap('/docs')`。旧 `/docs/docs/:path*` 仅做永久重定向；不要再重复加前缀。
- 中文目录走 `content/_meta.cn.json` → 现有导航生成器，顺序取官方 `mkdocs.yml`；稀疏快照用 `git show` 只读获取。正文相对链接通过 `getPageMDXComponents(metadata.filePath, pageMap)` 按源目录解析，只改真实文档目标，保留资源、外链与片内链接。回归见 `scripts/test-docs-{navigation,shell}.mjs`，不修改译文补偿路由错误。
- 文档主题独立存于 `duik-docs-theme`，默认亮色；切换时背景和文字同时跟随 Nextra token，不能给 body 固定白底。中文内置控件补丁保留在锁定版本的 `patches/`，直接改 node_modules 不算交付。

## 落地页协作约束（2026-11-01 更新）

**2026-11-06 本地归档增量：** 旧独立候选页、其发布/测试脚本和已完成评测副本已撤下；`landing:candidate` 不再可用，旧地址跳回 `/`。历史截图/日志与 Logo 试稿在仓库外，恢复位置及清单见 `docs/LOCAL_ARCHIVE.md`。`baseline/` 仍是发布输入；`output/riglab-demo/` 是当前角色编辑项目，不能把整个 `output/` 当缓存删除或忽略。保留文档媒体、来源/版权、共享角色 Skill 与 Git 历史；独立 `web-clone` 和中央 Skills 不在本次整理范围。历史报告已归档不等于本轮重新验收。本次仅整理，未继续 commit/push/deploy。

**2026-11-06 首屏镜头增量（覆盖下方420 ms淡出版）：** `components/brand/boot.{js,css}`保留1800 ms Logo入场，之后820 ms推镜虚化退场；140 ms后Hero五组子层以70 ms错峰、各900 ms清晰入场。只动画原GSAP宿主的子层，不能给滚动宿主重写transform。`data-duik-entry`只在此次入场存在，结束/输入/后台/reduced/pagehide清理；中断监听必须持续到最后一组结束，不得在资源ready时提前移除。CSS `:is`选择器优先级可能抵消子组delay，须核对浏览器实际0/70/140/210/280 ms，而不只查源码字符串。无JS/深链接/reduced不隐藏Hero；不引入新库或全屏backdrop-filter。

**2026-11-05 正式品牌与首屏性能增量：** A 方案朱红回环/青绿沙漏已获接入授权。`components/brand/logo.mjs` 是 SVG/PNG/ICO 与 metadata 真源，`npm run brand:publish` 输出 `/brand/v1/` 和 `/brand.html`；旧试稿恢复包已于 2026-11-06 移到仓库外，位置见 `docs/LOCAL_ARCHIVE.md`，不再运行旧发布器。普通导航与 favicon 静态，intro 有限，loader 仅等待时循环。**用户随后明确：缓存命中也必须自然过渡。** 首屏 boot 在 Nuxt 根外，无 JS 默认隐藏；普通进入保留 1800 ms 进场＋420 ms 淡出，Hero 并行准备，较慢时继续循环等待。5 s 超时，error/输入/后台放行，深链接/reduced跳过；淡出不切静态图导致沙漏跳帧。此前“160 ms/无最短等待”已被此决定覆盖。Hero 的 SSR/Vue/adapter 共享 `heroStageMarkup` 预留尺寸；不恢复模板隐藏的 200vw “B” 去伪造 LCP。`landing:optimize` 只生成交付副本和 Next 定向映射，原 PNG、rig JSON、sourceSha256 不动；无损须完整 RGBA 一致，PNG effort 会隐式 palette，普通 WebP 会改透明区 RGB，都不能直接使用。浏览器指标用 loopback `?perf=1` 实际 PerformanceObserver；空指标为未测，生产 HTTP 压缩与浏览器暖缓存计时分开记录，不将 dev 数值写成线上通过。

**2026-11-05 最新四项批注优先于下方历史布局约束：** 优化前基线 `0a5e915` 已获用户授权提交；后续不自动 commit/push/deploy。绑定改为物理滚动正向归位、向上倒序，终态可拖拽；纸飞机、悬挂装置、分层风景回到原横向轨道，不再在圆环后重复展示。目录分类上方使用宽幅动态插画，并移除该目录的官方截图区；其他位置的真实素材、文档和归属保留。Hero/22槽墙、工程整理、资产复用圆环及末尾工具/学习/API索引、开始使用/FAQ维持。“一次自动播放”“一幅Motion”“底部更多功能”仅为先前版本，不能覆盖本条。

- **绑定滚动映射。** 首层仅标题、26层舞台、最终控制器、归属/文档链接；不恢复阶段/部位/详情/复位工具栏。`data-workflow-scroll`通过sticky舞台与实际章节几何采样`seek(progress)`，没有计时自动推进或一次性锁。上下滚动共用同一镜头/PNG坐标；离开终态先保存用户pose，往返不能覆盖它。终态同时将组件属性和核心配置切为`drag`。背景恢复仅有界重采样，不能让共享核心的恢复绘制覆盖中间姿态。保留错误回退/重试及卸载代次保护；旧tour只用于兼容入口。
- **三幅插画回归横向轨道。** 原三slot按纸飞机→悬挂装置→分层风景显示，复用`renderMotion(...,{compact:true})`及原时钟；每卡短标题/用途/文档链接，无播放按钮、进度、参数或截图面板。90%可见循环、实际输入接管、离屏/后台/reduced停止。`#more-features`兼容锚点位于第一横向场景，底部不再重复gallery；共享父级继续真实测量宽度、横移并衔接原圆环。
- **目录分类横幅。** `catalog-banner.mjs`提供1200×300原创功能示意，八类与全部共九态，分类/搜索/文档结果即时同步，只有当前图形可见并运动。65%可见循环、离屏/后台暂停、reduce静态，切换取消旧动画，卸载和BFCache有守卫。移除的仅是目录官方截图UI，不删除公共官方素材；检索和阅读文字不循环。
- **曲线投影不改运镜。** 横向背景继续使用原 `.kp-home-capabilities-content > svg` 与描边时间线；投影覆盖 `J + se`，其中 `se` 来自父级已有圆环接近距离。只扩展原 `we()` 的 SVG width/viewBox/path，不改变轨道测量值、ScrollTrigger距离、横移或圆环阶段。发布幂等与真实投影函数回归分开核对；截图前后滚动跳变的帧不得证明滚动稳定。
- **三场景发布契约（2026-11-05）。** `duik-cinematic-composition-v2`保留父级首行owner和原三项computed列表，每卡仅完整art列，SSR/Vue同源；不能再slice成一卡。重复发布验证三项映射及各自文档目标；v1运行模块定向升级，旧一卡SSR需完整`landing:publish`从baseline重建。曲线仍投影J+se，不改原圆环索引、测量函数或滚动距离常量。代码回归与实际运镜分别验收。

动手前结合 [`docs/LANDING_REDESIGN_PLAN.md`](./docs/LANDING_REDESIGN_PLAN.md) 查看当前完成项与待办；功能层级见 [`docs/LANDING_EXPERIENCE_DESIGN.md`](./docs/LANDING_EXPERIENCE_DESIGN.md)，逐板块文档/截图依据见 [`docs/LANDING_CONTENT_AUDIT.md`](./docs/LANDING_CONTENT_AUDIT.md)。这些记录不能替代实际源码与运行入口检查。

**持续目标，不得缩减为换图任务：** 按用户选定的 Impeccable / Taste / Emil animate，先通过 SkillDo 核实或安装缺失技能及 Codex 实际链接，再继续整张 Duik 落地页的叙事、模块编排、素材、文案和交互重设计。仅阅读 GitHub 参考不算已安装。现有功能入口墙是首个局部交付，不代表整页完成；后续仍须减少教程化/学术化文案，以简洁动态场景表达真实功能，详细说明进入文档。

- **整页负责，不只 Hero。** 对导航、初识 Duik、绑定流程、通用工具、动画/自动化/摄像机、复用、功能目录、学习、FAQ、API、页脚建立“官方文档 → 文案 → 素材 → 交互”对应；不得等用户逐项指出才修正。可新增模块，但必须补上明确的信息缺口。
- **官方结构先于模板。** 以 `getting-started/first-look` 的八个主面板为准；Tools 下区分合成、图层、文本、脚本与表达式。库/管理是跨面板任务，API 属于进阶能力，不捏造第九个主面板。
- **功能真实，表达不必教程化。** 以固定 GitHub 文档版本核实功能；首层用短文案和可体验的动态场景表达结果，真实面板、操作步骤和来源放入次级展开层或文档入口。官方截图按原比例呈现。自绘 Web 演示必须标为原理示意，不称真实 AE 面板或执行结果；不得用 AI 生图伪造 AE/Duik UI。
- **素材可追溯且本地运行。** `official-media/sources.json` 记录官方路径、版本、尺寸和 SHA-256。素材同步用 `node scripts/sync-duik-landing-media.mjs`，不爬官网 HTML，不使用远程镜像、在线 iframe 或缺图占位冒充真实资源。
- **批准角色不变。** 复用已确认 26 层角色及共享绑定核心；不重生角色，不把单图当拆层，不将同一角色大图用于所有工具板块。
- **文案与节奏同时设计。** 主板块一条结果标题、一句短说明，用动画证明具体能力；详细操作进入文档，不把八个主面板铺成八段教程。消除没有内容变化的长滚动停留，保留可操作控制器、输入反馈及 reduced-motion。页面维持亮色，文档阅读器主题独立。
- **阶段不等于总目标。** 22 槽墙是首阶段；整页所有新增的简单面板加长说明都要重新审视、删减和重编排。保留根首页及已确认角色，不启用 `/landing-candidate.html`。墙的封面应铺满原卡片，保持素材比例；禁止重新加入倾斜截图底板、装饰圈、留白边框和烘焙标题条。标题/文档链接由宿主提供，SSR 与 Vue 共用映射，拖拽释放不误导航。
- **复用动态结构，不复制业务包装。** 先读 web-clone 中已存在的 Linearity、VoiceStudio、MotionFun 对应组件，再确定适合 Duik 的状态与因果。参考完整舞台、直接操控、分层展开、序列反馈，不机械移植模板品牌或把长期漂浮当高级交互。每块至少明确进入、演示、用户接管、复位、离屏暂停和 reduced-motion。一次目的明确的演示优于持续装饰循环；详细参数和真实面板进入次级层。
- **圆环父子契约。** `orbit-vue.mjs` 保留原 Linearity 组件及 `mergedProgress` / `go-to-step`，父级飞入、轮选、离场与子视觉一起发布；普通复用面板只放二级详情。桌面五项需键盘语义，初始 SSR 保持原组件的移动轮播分支。文档入口共用 `orbitDocumentation`，跟随原桌面选择/移动 swiper，不另造轮换时钟；三张 Motion 卡片保留各自文档入口，不重复全局阅读/安装双 CTA。SSR/Vue 补丁须检查完整映射，缺失锚点或新旧结构混存时失败关闭。完整模板能力取舍见 `LANDING_EXPERIENCE_DESIGN.md` 的“原模板能力审查”。
- **重组姿态交接。** 26张原 PNG 归位到中立坐标后，借共享 renderer 的 `render(pose)` 连续回到已保存姿态，不写掉用户 pose；中断必须解除隐藏与 inert。浏览器可见交接与本地状态测试分开验收。
- **自动演示分工（2026-11-04最新用户决定）。** 展示区自动演示，无播放/暂停/重播按钮、播放进度滑杆或纯播放复位。绑定滚入后仅展开→关联→控制一次，终态交还控制器；Tools/Motion/API/复用及墙/条带可见自动循环。被动hover/focus不暂停；实际操作与详情阅读优先，离屏/后台/reduced内部停止。真实参数、角色/视点复位、分镜选择和文档保留；分镜用离散按钮，内部时间用dataset记录而非隐藏input。检索/FAQ/学习不轮换，原圆环仍随滚动；自动演示不反复aria-live播报。
- **绑定连续完成。** 每镜头等相机、26层WAAPI及必要的500ms姿态恢复真正完成就立即推进；没有1800/3000ms最低停留，没有循环。末镜头完成后才开放drag，一次性状态不被IO/离开鼠标/失焦重置。同步完成、重复/过期完成回调与无WAAPI均须有回归。相同尺寸的ResizeObserver通知忽略；真实尺寸改变重定向未完成镜头，不能把静态重排当作镜头完成。
- **Motion 舞台与父级轨道一起设计。** 需要扩大横向演示时，同时检查卡片父级列宽、列间距、标题实际标签（模板可能使用 `.h2` 而不是 h2）和滚动测量；SSR 与 Vue 运行结构用同一发布映射，不硬编码 GSAP 测量值。循环复用原时间线往返，不跳切首尾；鼠标/键盘操作优先于自动播放。
- **轨道尺寸重算。** 交互后的 production resize 同样要重测：RAF 合并 → Vue nextTick 等响应分支 → 原测量/时间线 → nextTick 等 spacer → ScrollTrigger.refresh。按当前物理滚动位置更新，不强制 scrollTo；代次与卸载守卫阻止陈旧回调。仅测量宿主不得再输出 `content-visibility:auto / contain-intrinsic-block-size:auto 500px`，SSR 与 Vue render 一起移除，其它区块优化保留；代码回归与实际 resize/reset 后锚点分开验收。
- **减少动态效果的父级轨道。** 圆环子组件静帧与CSS纵向布局不能代替父级停用。初始reduce及偏好change须释放原GSAP上下文并清除spacer；恢复时与resize共用上述队列，按新布局重测而非仅refresh旧闭包。保留原测量函数及桌面手动五项选择，不强制回到旧滚动位置；卸载清理media listener，回归覆盖快速切换与两段nextTick。
- **圆环偏好交接。** 进入reduce手动模式时继承原子组件当前选中项和文档，匹配原八图/五内容及15°选中偏置，不简单归零或按五等分猜选项；重复change不能覆盖手动选择。退出时交回父级物理滚动进度，不为保留手动项强制滚动。回归直接执行真实wrapper与原子组件选择/键盘/文档表达式，明确区别于系统偏好切换的浏览器验收。
- **圆环选择定位。** 五项选择由原时间线反算当前滚动区间，不再额外减固定像素，否则短轨道或 resize 后可能落到前一项。回归贯穿真实父事件、GSAP 时间线、子选择及文档目标，并核对实际发布模块；代码证据不代替完整运镜视觉验收。
- **圆环亮色呈现。** 中文轮换词的裁剪行盒与 `yPercent` 位移行盒保持一致，不用额外下边距撑高窗口。原暗色 SVG 不靠文字颜色修正；官方本地图标由 `orbitIconProps` 共用 SSR/Vue alpha mask，保留原进度描边、移动选中态及14张图片的索引契约。重复发布需逐项核对既有图标属性，不能只数标记数量。
- **图层管理首层。** Tools默认图层管理，入口次序为图层→文本→脚本与表达式→合成，裁剪为末项而不是开场；`TOOL_TABS[0]`共用SSR/运行初态，裁剪框/角点与其他场景首帧隐藏。在既有几何舞台以同一播放头往返整理名称、组别、侧别、类型；标签跟随选层/拖拽，倒放/复位恢复源名。类型为Duik“美术（Art）”，不冒充AE分类或自动识图/官方命名算法；26层筛选与真实面板仍在详情。
- **Motion 画幅与接管。** 主画幅当前可见面积至少90%才自动循环，Tools/API/绑定/复用的门槛为65%；加载/解码就绪同样必须满足。精确参数在画幅内按需展开，移除时间滑杆后保留舞台尺寸与真实参数命中；短桌面等比收窄完整画幅。变换轨道中的可见控件使用原位鼠标验证，记录点击前后scrollY，避免定位器自动滚动把目标带离屏幕后误判。
- **横向轨道键盘交接（2026-11-04）。** 保留各场景原生Tab顺序，不能用离屏inert使后卡不可达。真实Tab进入屏外控件时，从当前原平移tween反算即时物理滚动；进入圆环使用原父阶段与当前选中项，不当作第四张Motion卡片。指针聚焦与可见控件不触发定位；resize须在两次Vue提交和refresh后恢复，reduce/卸载作废旧请求。窗口捕获blur必须过滤target，不能把普通元素失焦当窗口失焦；回归覆盖keydown→旧元素blur→focusin→keyup，真实Tab证据与模拟DOM测试分开。
- **元数据标题边界。** 发布 HTML head title 时按 parse5 DOM 识别 head title，不能误改 SVG 内部 title，否则会破坏图形的可访问名称。
- **模板头部与图片语义。** 旧站所有权验证和计费监听按head节点定向清理，保留Nuxt初始化/预载及原baseline。圆环三张装饰补图的空alt由SSR/Vue同源发布，五项功能标题与14图索引不变；回归验证幂等、混合映射拒绝及实际发布产物。
- **媒体缓存与点击遮挡。** 生成封面换版时使用新资源地址，避免图片代理一小时缓存掩盖修改。旧粘性区块改为正常流后，移除其透明宿主的负边距/补偿内距，不能只给内部控件提高 z-index；验证真实鼠标点击，而不是仅调用 DOM click。
- **图片墙最新决定（2026-11-02）。** 22槽使用原创动态功能插画，不以真实截图作封面。图下常驻“模块名+一句用途”，不依赖悬停或烘焙文字；heroWallScenes.summary为SSR/客户端真源。保留原卡片几何/拖拽。SVG-as-image不能靠父CSS暂停，用同源poster切换处理离屏/后台/reduced。截图只在详情/文档，插画不称真实AE输出。
- **墙体控制与验收。** 无悬浮播放按钮；可见封面自动启用SVG，离屏/后台/reduced使用同源poster。验收切换picture source须等待当前资源解码；拖拽/文档入口原语义不变，失败后恢复测试媒体偏好。
- **墙体观察器交接（2026-11-04）。** picture与实际img成对登记；水合替换/换img/移出时解除旧观察，排队旧entry不得重新登记已移除图片。最终pagehide后IO/Mutation/sync失效，persisted返回重新按当前可见性决定自动播放。执行真实mount延迟回调，不用字符串匹配代替生命周期测试；受控测试不是图片解码/视觉验收。
- **墙中央轮换标题。** 修改时以 `content.mjs` 的 `heroWallIntro` 同步阶段标题、说明和固定后缀。模板会从首行减去最后一个阶段词；结果为空时，SSR 必须与 Vue 一样输出注释而非残留标题行。此条件由 `patchHeroWallIntroSSR` 和墙体测试守护，保留原轮换时序。
- **功能卡片说明常驻。** 22 槽墙每张插画下方始终显示模块名与一句用途，不依赖 hover；`heroWallScenes.title/summary` 是 SSR 与 Vue 的同源数据。发布后核对 22 个入口、22 组说明和本地文档目标，不能把源码数量当视觉验收。
- **卡片文字层级（2026-11-03）。** 标题/用途用独立 `duik-wall-title` / `duik-wall-summary` 类，SSR 与 Vue 一起发布；移除模板的 `text-white/60` 与 `whitespace-nowrap`，避免亮色全局规则把说明染成标题色或强制单行。图下文字不增加悬停、淡入或循环动效，原封面几何与拖拽钩子保持。
- **轮换文案与复用状态。** Hero 的连接词、轮换内容和可访问摘要由 `content.mjs` 统一发布到 SSR/Vue，不能只修静态标题；绑定第一阶段展示已准备的透明层，不暗示自动拆图。复用区的待选素材/分镜、已存条目、已取用结果是三个状态；取用保存 `{id, frame}` 快照，后续选择、播放和再次保存不能改变它，只有再次取用或重置才更新结果。分镜控件放在待选侧，接收侧保留结果。
- **绑定主舞台。** 生产首层按上述最新增量保持纯舞台与控制器；旧阶段/部位/详情节点仅为可选兼容入口，缺失时仍能完整挂载、自动演示与清理。65%可见且26层解码后首次自动演示，完成或中断后交还控制，不重新写入pose。初始化与运行期rig-error保留poster/重试；加载代次及element/rig/cinema身份共同保护所有await后的写回，旧解码与finally不得覆盖新实例。重试按钮的pointerdown/focusin不是手动选阶段；按root幂等挂载。DOM回归不算WebGL/视觉验收。
- **绑定可见性队列。** 同批IO消费当前画布最后有效项；已开始演示中出现离屏则取消旧等待，无动画收束到control，返回不重播。尚未开始的离屏不能消耗首次机会；reduce直达终态。卸载后IO/完成回调/syncAuto不得写回同root新实例。回归投递排队旧回调并核对真实opacity/inert，不只断言disconnect。
- **绑定输入交接。** 接管阶段的控制器、所选部位、网格与关联层同步，但不移动镜头。核心会重建SVG控件并恢复焦点，pointerdown应先聚焦新控件；同部位focusin不得重复render，且只接受核心已捕获的pointerId。关闭拖动、隐藏控件、切模式、重置/导入姿态、播放、离屏与卸载要取消旧拖拽并释放capture；选择部位/显示网格不取消正常拖动。回归同时覆盖旧键盘焦点→新鼠标目标和拒绝第二指针，不能只测单次拖动。
- **API 与学习首层。** API三条真实调用驱动一个关系舞台；同一figure正常流呈现“选中对象→apiExamples.call→能力结果”，调用不重复/不增代码面板。原4200ms镜头自动往返，切换示例立即演示；无阶段跳转、时间拖动或播放复位，data-api-position仅作内部观测。打开详情暂停，关闭恢复，reduce终态可读；初始化/官方图在关闭详情，不执行AE。学习仍是五任务/五主入口/11后续链接，键盘即时/指针180ms反馈，不循环阅读内容；离屏/后台/reduce/卸载停止反馈。受控测试不写为物理切换标签页实测。
- **API首层去重回归（2026-11-04）。** 可见status只叙述阶段或能力结果，不重复调用代码；首层调用只在关系行出现一次，关闭详情仍保留可复制片段。SSR及三示例×三阶段、减少动态效果的回归须统计详情外的真实文本，不只统计`data-api-call`节点，以免别处悄悄复制同一字串。
- **整页收尾顺序（2026-11-02）。** 原三处宿主按文档位置承载 API → 工具目录/学习 → FAQ，再接页脚；SSR发布和Vue模块必须同步，不能只移动静态DOM。当前映射为 HomePricing→api、HomeFaq→catalog、HomeContact→faq；发布器按宿主位置排序，重复发布不得再轮换。目录保留八主面板/33精选入口，官方截图只在details按需展开并保留固有尺寸。FAQ默认四个入门问题，其余七个仍可分类/全部查看；不删除事实与归属。检索、键盘选项和阅读问题不加解释性动画，已有演示区才承担动效。
- **检索与阅读首层。** 目录直接显示搜索、八个官方图标分类及当前结果，“全部”同步标题/指南并清空搜索；学习用五任务导航、一个主文档和后续路线承接。两区不重复图片墙封面，原官方截图保留在关闭的详情。验收同时核对选中状态、唯一可见内容及真实文档目标，不能只断言按钮已选中。
- **增量更新记录。** 每轮实质改造同时更新本文件的可复用约束、README 的真实入口/命令、`docs/LANDING_REDESIGN_PLAN.md` 的完成项与未完成项。不把过往测试当本轮验收。
- **多代理按文件分工。** 主代理持有共享布局/发布脚本，其他代理只编辑分配模块；发布、主服务与最终构建统一执行，不并发重启或覆盖共享文件。
- **避免宿主布局回归。** 懒加载面板图预留真实固有尺寸，不能加载后推偏锚点与横向动画测量；原 Vue 头部会在滚动时更新 class，落地页导航覆盖使用稳定的专属 data 标记，不能靠动态追加 class，也不能用全局 `header` 规则隐藏板块标题。
- **首帧与接管一致。** 导航 SSR 与 HeaderKP 共用 `navMarkup`，亮色标记在首屏就存在；原暗色遮罩从渲染树移除，不等 mounted 后隐藏。主背景与独立边缘光效分别维护暂停/卸载契约；边缘光保留固定shader与可见时间线，覆盖后台RAF/GSAP、reduced静帧清屏、异步初始化与陈旧回调。VM/WebGL替身测试不代替浏览器视觉验收。
- **Hero 底部条带。** 保留原LogoMarquee实宽测量、自动横向循环与Hero退场；八主面板共用tool-catalog和本地图标，左右为入门链接和“查找工具”。首份提供键盘入口，副本不重复Tab；透明退场内部暂停并让整条ribbon inert，返回/卸载恢复焦点边界。发布器支持旧按钮版定向升级，SSR/Vue一起发布。
- **Hero 局部精修（2026-11-05）。** 上下剩余空间以等权flex分配，让标题与角色自然居中，不改角色姿态、镜头或加像素位移。首屏移除“复位/隐藏控制器”的节点和事件，控制器保持可见；错误回退/重试保留，重试成功将焦点交回新控件，不给shadow host设负tabindex阻断内部Tab顺序。八面板条带侧列按内容宽度，中间占剩余空间且解除模板max-width；保留原实宽测量、循环和滚动退出/inert契约。
- **墙到绑定背景衔接。** 介绍和绑定共用原全页动态亮色色场，不再各自绘制paper/灰绿实底，画布状态条同样透明。不得用不透明遮罩隐藏上一章节动画；保留原父级退场和现有排版几何，截图按用户缩放校准。
- **工具比较舞台。** 左右构图共用画幅比例、尺度与参考点，首层保留一组结果标题。外围双曲线只消费真实滚动，不拥有工具播放头、用户偏移或全页背景注册；保留原正常流与已修正的宿主边距。组件实现、局部测试与整段视觉验收分开记录，避免因陈旧“待重做”反复替换已完成场景。
- **组件类名隔离。** 新舞台不能复用旧 `visual-scenes.css` 的状态类；绑定画布使用 `duik-workflow-canvas`，不是旧绝对定位/隐藏的 `duik-workflow-scene`。主画布设置 `flex:none`，避免父级布局将其压成零高度。
- **角色画布与故障恢复（2026-11-03）。** resize通知只标记待布局；真实位图尺寸变化、camera同步和绘制须在同一render完成，尺寸相同不写canvas宽高，离屏不清空上一帧。Hero同时处理初始化与运行期`rig-error`，明确显示静态原图并提供重试，重试/卸载隔离陈旧回调。loopback的`?rig-diagnostics=1`只读取现有实例buffer；解码途中实例更换/出错须拒绝旧快照，未ready不得创建上下文。默认首页不加载诊断UI，不能把静态回退当作绑定正常。
- **验收与授权。** 先实施再做范围内的桌面功能与资源检查，遵守用户明确限制；`npm run build` 必跑。构建期间避免与 dev 共写 `.next`，结束恢复原端口。不得自行 commit/push/deploy。
- **定向验证不冒充整合通过。** `landing:verify` 可用 `LANDING_CHECK_FILTER`（正则）和 `LANDING_CHECK_OUTPUT`（独立报告目录）；报告记录filter、skippedChecks和是否真正发起文档导航。已完成的检查不反复全量重跑。对于短时分镜，分开验证完整进度与手动停止，记录真实点击前后状态；不要在只剩650ms的帧窗口中重复定位后把“播完后重新播放”误判为停止无效，也不能修改组件时长迎合驱动。
- **截图与系统偏好边界（2026-11-04）。** 用户当前80%页面缩放下，IAB深滚截图需按实际DPR校准scroll坐标和视口裁剪，并记录捕获前后scrollY；默认空白或未校准区域不是页面缺块证据，不改用户缩放来迎合工具。用户明确不允许修改macOS辅助功能设置，系统级减少动态效果切换保留为未实测；代码媒体事件回归不能冒充该项通过。
- **验证器生命周期。** 将共享头部拼入`data:`模块的专项驱动需先把相对static import解析为原文件的file URL。复用检查按filter独立打开真实二级工作台，失败也必须依次关闭dialog/截图详情/工作台，并恢复媒体偏好；断言使用已取用的`{id,frame}`快照。import和清理替身回归只证明驱动边界，不表示已运行浏览器主体。

## 验收底线

- **Logo 独立试稿（2026-11-05）。** 用户已选 A，当前朱红回环/青绿沙漏试色；仅改配色，不重画或自动接入正式首页。四版只在`/logo-lab.html`，真源`components/home/landing/logo-lab/`，独立`publish-duik-logo-lab.mjs`发布，不改首页/favicons/角色。各自进场后自动循环，不按早期“结束静止”回退；static/intro/loop/mono同源几何，离屏/后台/reduced静态，返回恢复loop，点击才重看进场。引用上游固定版本，不称最新官方品牌规范；选定方向不等于配色或正式上线获批。

改动后：`npm run build` 通过；不引入死链（首页↔文档跳转）；中文文案无术语冲突；新增文件遵守上述硬规则。
