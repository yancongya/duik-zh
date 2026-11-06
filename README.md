# Duik 中文站（duik-zh）

> Duik Ángela（After Effects 专业角色绑定与动画工具集）的**非官方**中文文档站与产品介绍首页。

- 官方网站：[duik.org](https://duik.org/)
- 上游文档仓库：[RxLaboratory/Duik](https://github.com/RxLaboratory/Duik) · `src-docs/docs/`
- 技术栈：**Nextra 4**（Next.js App Router）· 内容直接同步上游 Markdown，不爬取官网 HTML
- 完整改造方案：见 [`PLAN.md`](./PLAN.md)

## ⚠️ 免责声明

本站为非官方中文社区翻译与知识库，与 Rainbox Laboratory / Nicolas "Duduf" Dufresne 及官方 duik.org **无隶属关系**。软件本体请仅通过官方渠道获取。

## 协议

| 内容 | 协议 |
|---|---|
| Duik 软件本体 | [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html) |
| 上游文档及本站译文 | [GNU Free Documentation License 1.3](./LICENSE-GFDL-1.3.md)（无 Invariant Sections / Cover Texts） |

译文属 GFDL 定义的「修改版」，归属与修改声明见 [`NOTICE.md`](./NOTICE.md)。

## 项目结构

```
app/                  Next.js App Router（文档路由、资源处理；首页由 rewrite 接入）
components/home/landing/  落地页可编辑真源、固定模板基线及本地官方素材
public/landing.html   首页发布产物（不要直接编辑）
public/duik-experience/  首页模块、样式与官方截图发布产物
content/docs/         中文/占位文档（MDX，遵守已翻译内容保护规则）
content/_meta.cn.json  中文导航标题真源（生成 content/docs/**/_meta.js）
docs/                 本站协作文档（GLOSSARY / TRANSLATING）
scripts/              同步与转换脚本
upstream/             上游 src-docs 快照（CI 刷新，勿手改）
.github/workflows/    同步 + 构建流水线
translation-manifest.json   翻译状态清单
sync-report.json      最近一次同步报告
PLAN.md               整站改造落地方案框架
```

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

常用脚本：

```bash
npm run sync       # 盘点 upstream/docs，更新 sync-report.json 与 translation-manifest.json
npm run nav        # 官方 mkdocs 顺序 + 中文映射 → content/docs/**/_meta.js
npm run convert    # 把上游未处理的 md 转为 content/docs 占位（永不覆盖已存在文件）
```

## GitHub Pages

当前发布目标是本仓库的 GitHub Pages，通过 `.github/workflows/deploy.yml` 在 `main` 推送后构建发布；PR只构建。站点基路径为 `/duik-zh/`，保留完整落地页运行时、角色交互、Nextra文档和中文搜索。

```bash
npm run test:pages
npm run build:pages    # 独立临时目录构建，生成 out/，不影响3017的.next
npm run preview:pages  # http://127.0.0.1:3018/duik-zh/
```

部署机制、验收范围和历史修复备份见 [GitHub Pages 发布](docs/GITHUB_PAGES.md)。文档返回首页使用完整导航，避免 Next 客户端路由打开未启用的 React 首页。

## 文档图片与视频

文档入口为 `/docs`。图片从本地 `public/docs-img/` 提供；`predev` / `prebuild` 自动核对全部 MDX 图片引用，缺图会直接失败，不再用 HTTP 200 的 SVG 占位掩盖。稀疏检出恢复与外链状态见 [文档媒体交付](docs/DOCS_MEDIA_DELIVERY.md)。

```bash
npm run docs:media                  # 本地引用、实际文件及图像签名
npm run docs:media:test             # 图片映射和 Video 渲染回归
npm run docs:media -- --origin=http://127.0.0.1:3017
npm run docs:media -- --check-external-images --check-videos --output=output/docs-media-audit.json
```

2026-11-06 已恢复 739 个仓库图片文件，132 篇文档的 531 个本地图片引用完整。53 个官方旧 MP4 地址实测失效，本站显示来源说明、官方课程入口及重试；**不代表站内视频播放已恢复**，不镜像或绕过课程访问限制。两张 Wikimedia 旧缩略图在渲染层精确映射至同一素材的有效原图，保留译文与归属。

## 落地页开发（当前根首页）

2026-11-06 已将过时候选页、试稿和历史验证输出移到仓库外可恢复归档，详见 [本地归档与恢复](docs/LOCAL_ARCHIVE.md)。`landing:candidate` 已移除，旧候选地址跳回 `/`。当前根首页、文档、品牌、绑定工作台及其资源保留；`baseline/` 是发布输入，`output/riglab-demo/` 是编辑项目，不能当作旧文件删除。

当前落地页 `/` 由 Next.js rewrite 到本地 `public/landing.html`；Nextra 文档继续位于 `/docs/*`。页面沿用已复制的交互运行时，不依赖线上镜像。修改源文件后必须发布，不能只改 `app/page.tsx`。

```bash
node scripts/sync-duik-landing-media.mjs  # 按固定上游提交补齐官方面板截图，仅开发时运行
npm run landing:publish                  # 真源 → 本地 HTML、模块、样式与资源
npm run dev -- --hostname 127.0.0.1 --port 3017
npm run landing:test                     # 模块与发布契约测试
npm run landing:verify                   # 实际本地主页的定向桌面交互验收
node scripts/validate-duik-wall.mjs       # 当前铺满封面、拖拽与文档导航
node scripts/validate-duik-workflow.mjs   # 真实26层角色的拆分、关联、控制
node scripts/validate-duik-motion-scenes.mjs # 插值、自动化、立体景层的真实输入
node scripts/validate-duik-reuse.mjs      # 选择、存入、取用、分镜与真实参考图
node scripts/validate-duik-api.mjs        # 三调用自动循环、详情复制与生命周期
node scripts/validate-duik-learning.mjs   # 五任务、16条阅读入口与真实文档导航
npm run build                           # 构建前停止同仓库 dev，完成后恢复
```

- 可编辑真源：`components/home/landing/`；发布脚本：`scripts/publish-duik-landing.mjs`、`patch-duik-landing-visuals.mjs`、`publish-duik-experience.mjs`。
- 官方素材：`components/home/landing/official-media/`，来源、提交、尺寸、摘要及归属见 `sources.json`。使用官方文档截图说明真实面板，网页交互仅解释原理，不代表在浏览器执行 AE。
- 页面实际顺序为“Hero/功能墙 → 滚动绑定 → 工程整理 → 三幅横向动态场景 → 资产复用圆环 → 工具/学习/API 索引 → 开始使用/FAQ → Footer”，保留已确认角色。目录分类上方新增横向动态示意，不再显示目录官方截图区；其他素材与文档入口保留，不用假 AE 面板冒充功能。
- 实施状态与剩余工作见 [落地页 Plan](docs/LANDING_REDESIGN_PLAN.md)，功能层级见 [产品叙事依据](docs/LANDING_EXPERIENCE_DESIGN.md)，各板块的文档和截图来源见 [全页内容对照](docs/LANDING_CONTENT_AUDIT.md)。后续改造应同时更新对应记录，不沿用旧版本的验收结论。
- 角色制作与验证：`/rig-test.html`；可嵌入组件演示：`/rig-embed.html`。这两页不替代落地页，也不是 AE 插件运行环境。
- 正式 Logo 规范：`/brand.html`。已选 A（朱红回环＋青绿沙漏），双色/单色/反白、16～1024 px、静态/进场/加载 SVG 统一从 `components/brand/logo.mjs` 生成。`npm run brand:publish` / `npm run brand:test`；首页与文档导航、favicon 和 manifest 已同源接入。旧 `/logo-lab.html` 重定向至规范页，四案恢复包已移到仓库外，见 [本地归档](docs/LOCAL_ARCHIVE.md)。见 [品牌规范](docs/BRAND_GUIDE.md)。
- 首屏 loading（2026-11-06）：缓存命中也播放1800 ms Logo进场，接820 ms推镜虚化消散；Hero标题、角色、说明、CTA、条带在退场期间以70 ms错峰清晰入场。资源并行加载，交互/后台/reduced随时取消并恢复可用内容，不改原滚动宿主。`npm run brand:test`覆盖完整入场与中途中断。`npm run landing:publish`包含品牌发布与`landing:optimize`：原母图与透明层不动，逐像素验证交付副本，再由Next定向映射请求。压缩可用本地`cwebp -lossless -exact`，缺少时回退PNG。
- 性能诊断：本机 `/?perf=1` 启用只读观测，默认首页没有遥测请求。构建后用 `next start` 运行 3017，再执行 `node scripts/audit-duik-performance.mjs` 复用已安装 web-perf 静态检查并核对实际 HTTP；详细证据见 [本轮验收](docs/BRAND_PERFORMANCE_ACCEPTANCE.md)。
- 默认只改落地页，不修改文档译文、上游快照或发布到远端。构建通过、浏览器检查与真正的 AE 宿主验证分别记录。
- 定向桌面验收输出 `output/duik-experience-check/report.json`，分别记录首页交互与资源、Nextra 导航、文档媒体请求；`--inspect` 仅用于诊断。首页本地资源通过不代表文档区全部离线，也不代表手机或 AE 实机已验收。

### 当前交付：整页 Duik 叙事与视觉升级

**最新四项批注（2026-11-05）：** 绑定区由滚动逐帧驱动，向下归位、向上倒序，终态交还控制器并保留用户姿态。纸飞机、悬挂装置和分层风景已回到原横向穿梭三slot，底部不重复；`/#more-features`兼容锚点随第一场景迁移。目录增加4:1分类动态插画，移除该处官方截图，搜索/八分类/33文档入口保留。根预览`http://127.0.0.1:3017/`与真源`components/home/landing/`不变，执行`npm run landing:publish`同步。验收与构建结果见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)；以下同日“一次播放/底部插画/单幅场景”为历史记录，不覆盖当前决定。

**Hero 局部精修（2026-11-05）：** 主内容通过上下等权空余空间居中，移除首屏“复位/隐藏控制器”按钮，12个控制器与错误重试保留。底部八面板条带扩满两端链接之间的空间；当前1331×1086桌面可视窗口约539→1004px，原循环和滚动隐藏不变。17项定向回归通过，真实拖拽、Tab切换与退场恢复已核对；证据及本轮构建状态见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。真源、`npm run landing:publish` 和根预览 `http://127.0.0.1:3017/` 不变。

**最新增量（2026-11-05）：** 绑定区只保留滚入一次的26层映射和最终控制器，移除外围阶段/部位/详情工具栏；横向穿梭恢复原曲线并扩展到圆环衔接；旧悬挂装置、纸飞机与分层风景恢复为底部“更多功能”插画，自动循环、可直接拖拽，没有播放按钮或进度条。根预览仍为 `http://127.0.0.1:3017/`，新增位置 `/#more-features`；真源与发布命令不变。当前定向159项通过，桌面控制器接管与插画可见循环已实测；完整证据及构建状态见 [本次恢复验收](./output/restoration-acceptance-2026-11-05.md)。

**前批（2026-11-05，核心章节精简）：** 优化前基线为 `0a5e915`；后续改造保留工作区、未再次提交或推送。中段已合并为绑定、工程整理、动作表现、资产复用四个核心场景，末尾只保留功能/学习/API 索引及开始使用/FAQ。真实面板与 API 进入详情，入口和归属不删。沿用 `/`、3017、26 层角色和原圆环；真源仍为 `components/home/landing/`，通过 `npm run landing:publish` 同步。新设计全套 534 项中 533 通过、1 可选跳过；最后语义修正相关 39 项、可见门槛修正相关 20 项通过。最终构建成功（137 页），3017 已恢复。1500×1086 和 1280×800 桌面画面、实际拖拽/循环与文档跳转已定向验收；独立复核唯一修复项判定 resolved / ship。证据见 [前批验收](./output/cinematic-acceptance-2026-11-05.md) 与 Plan §0；不外推手机、AE 或系统级减少动态效果。

**最新交互决定（2026-11-04）：** 展示区移除播放进度滑杆、播放/暂停/重播及纯播放复位，自动演示无需点击，被动悬停/聚焦也不停止。绑定区仍只连续演示一次后交还控制器；工具、Motion、API、复用、墙与条带可见自动循环。幅度/频率/视点等真实参数按需展开，动画库以三个分镜按钮选择待存动作，保存/取用快照不被循环覆盖。实际拖拽与详情阅读优先，离屏/后台/reduced停止；原模板运镜、批准角色和亮色不变。真源 `components/home/landing/`，同步命令 `npm run landing:publish`，预览 `/`；独立角色工作台不受影响。当前结果见 Plan §0“去除播放进度界面”。

本轮已发布：457项测试中456通过/1可选跳过，137/137页构建成功；当前桌面实测各演示循环、普通hover/focus不停，以及复用分镜快照保持。预览服务已恢复3017。证据与边界见 [去除进度界面验收](output/no-scrub-acceptance-2026-11-04.md)。

前批全循环版的434通过/1项可选跳过、137页构建及浏览器记录保留在 [自动循环验收记录](output/autoloop-acceptance-2026-11-04.md)。该版绑定循环已被最新一次性决定替代，不计为本次验收。

前批一次性版：测试442通过/1可选跳过，构建137/137页；浏览器实测连续三镜头、拖拽姿态保留/返回不重播及默认图层管理循环，见 [一次性绑定验收](output/workflow-once-acceptance-2026-11-04.md)。该版仍有进度滑杆，不能当作本次无播放器界面验收。

**当前状态优先看 [Plan §0 当前交付与剩余验收](docs/LANDING_REDESIGN_PLAN.md#当前交付与剩余验收2026-11-04)。** 下方分批记录中的“待验收”只代表当时状态，不作为重复重建模块的指令。Hero底部八主面板条带已恢复；圆环补齐减少动态效果的父级停用/恢复及选中项交接，正常模式仍使用原模板完整运镜。针对这项交接运行 `node --test scripts/test-duik-orbit-preference.mjs`；它是运行逻辑回归，不代替系统偏好切换或整页连续视觉验收。

**桌面整合收尾（2026-11-04）：** 已完成从Hero到Footer的33点单向自然滚动走查，包含原环绕大图→左圆环/右说明→旋转离场；未观察到整段空场或缺块。真实完成页脚→本地中文安装文档→根首页。最后清理旧站head验证/计费脚本及圆环装饰图语义，保留角色、原镜头和SSR/Vue同步发布；定向**52/52**、`npm run build` **137/137页**通过。报告、逐点图片和边界见[最终桌面验收](output/landing-final-acceptance-2026-11-04.md)。这是本轮桌面整合完成，不是逐帧录像、全控件重测或全站离线验收；按用户决定不修改macOS设置，系统级减少动态效果切换保持未实测，手机/AE不外推。

```bash
node --test scripts/test-duik-landing.mjs scripts/test-duik-orbit-presentation.mjs scripts/test-duik-capability-links.mjs scripts/test-duik-orbit-preference.mjs
npm run landing:publish
```

根预览仍是 `http://127.0.0.1:3017/`，由本仓库Next服务运行，真源仍在`components/home/landing/`。以下为保留的实施批次记录，以各自日期/范围理解，不覆盖上述最新交付状态。

2026-11-04 用户确认实际预览能看到下方各板块，截图工具返回空白不再作为页面缺块依据。本批补齐横向 Motion 的键盘焦点交接：Tab / Shift+Tab 即时定位到原轨道中的目标场景，圆环入口使用自身阶段；鼠标滚动与原运镜不变。专项命令：`node --test scripts/test-duik-capability-keyboard.mjs scripts/test-duik-capability-resize.mjs`，发布仍执行 `npm run landing:publish`；本轮实际结果及剩余验收以 Plan §0 为准。

**绑定演示交接（2026-11-04）：** 自动演示保留原有最低停留时长，并等待图层、相机与已保存姿态恢复完成后推进，避免慢回调造成姿态跳变。接管和暂停仍即时；不更换26层角色、不修改共享绑定核心。专项命令：`node --test scripts/test-duik-workflow.mjs`。实际发布、浏览器采样与构建结果另记于 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)，单元测试不等于连续画面验收。

**图片墙与API首层收尾（2026-11-04）：** 图片墙的暂停、离屏、后台与减少动态效果使用真实mount函数的受控回归，覆盖水合换图后的旧观察通知和最终退出后的延迟回调；旧图片不再让离墙后的按钮重新出现。API状态行去掉重复调用代码，首层只保留舞台内的调用关系，复制代码仍在详情。定向命令：`node --test scripts/test-duik-hero-wall.mjs scripts/test-duik-api-cinema.mjs`；不改变原卡片几何、拖拽或API镜头节奏。发布/构建和本轮浏览器连接限制见Plan §0。

**绑定可见性与实际验收（2026-11-04）：** `orientation.mjs` 消费当前画布的最新可见性通知，并阻止旧挂载回调写入新舞台；批次内离屏仍中断演示，返回只恢复按钮。三条真实挂载回归先失败后通过；定向整合94/94、构建137/137页。定向命令仍为 `node --test scripts/test-duik-workflow.mjs`，发布仍走 `npm run landing:publish`。当前浏览器已完成角色拖拽、保存姿态重播、离屏返回及API三示例/播放暂停实测；截图已按页面缩放校准，但零星捕获期间位置变化仍单列，不冒充整页不间断验收。详情见Plan §0。按用户决定，不修改macOS设置，系统级减少动态效果切换保持未实测。

**交付入口仍是 `http://127.0.0.1:3017/`，目标是整页改造，不止媒体墙。** 整页围绕“角色绑定 → 动画节奏 → 日常工具 → 资产复用 → 进阶 API / 学习”组织中文内容、真实素材与适用动效；亮色、已确认角色和可见控制器保留。Nextra 文档正文保持，2026-11-03 按授权修复了文档壳、中文导航和路由。先应用已安装的设计 Skills，再逐区实施。

第一阶段处理 Hero 下方原有 22 槽墙。2026-11-02 用户进一步确定：**封面使用功能主题的原创动态插画，不使用真实截图；每张下方常驻模块名和一句用途。** 当前发布 22 张本地 SVG 动态封面和对应静态 WebP，铺满原卡片，点击直达对应本地文档。官方截图保留在详情与文档；已确认角色和 Hero 不变。

- 保留原布局、滚动错位/缩放、GSAP 时序与拖拽；必须区分点击和拖拽，拖拽释放不能误导航，键盘激活可进入文档。
- `hero-wall-scenes.mjs` 的同一 `heroWallScenes` 管理封面、模块名、简短用途和文档目标，`hero-wall-art.mjs` 生成动态几何插画；`scripts/lib/landing-hero-wall.mjs` 同步 SSR / payload / 常驻下方说明与链接。资源使用 `-illustrated-fullbleed-v2` 新地址避免旧图缓存。封面可暂停，离屏/后台显示静态图，减少动态效果时直接选用 WebP。
- **历史方案已替代**：此前“保留点击选中/图片展开并同步弹层”不再适用。22 槽是精选功能入口，不等于 22 个官方主面板，不生成假 AE UI。此前生图 API 返回 403 `Country/region not supported`，未产出新图。
- `landing-candidate` 已于 2026-11-06 归档，命令已移除、旧地址跳回首页（见 [恢复清单](docs/LOCAL_ARCHIVE.md)）；其 9 项常规桌面检查及未关闭的 reduced-motion 问题仅作历史，不能作为当前入口改造的通过证明。
- 旧的“本次只做媒体墙、不推进整页”范围已被本轮授权替代；媒体墙完成后继续整页五段编排，不恢复独立候选路线。分期目标与待验收项以 [Plan §0](docs/LANDING_REDESIGN_PLAN.md) 为准，官方功能与素材依据见 [体验方案](docs/LANDING_EXPERIENCE_DESIGN.md)。

目录使用开放式检索，官方截图按需展开；FAQ默认四个入门问题，另外七个仍可访问；页脚以安装指南为主行动，保留官方获取和完整归属。历史浏览器分批结果与未测项见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)，不外推为当前版本、手机、AE实机或全站离线验收。

**设计 Skills 已完成真实安装（2026-11-01）**：既有 `taste-skill` 保持原版本；通过 SkillDo 补装 `impeccable`（仅 `.agents/skills/impeccable`）与 Emil `animate`（仅 `skills/animate`），并分别定向同步至 Codex。三项实际 symlink 和 `SKILL.md` 可读性均已核对；完整源仓库、子路径、revision 与本机路径见 [Plan §0.1](docs/LANDING_REDESIGN_PLAN.md#01-设计-skills-安装记录2026-11-01)。这是安装完成，不等于整页已应用或验收完成；没有全量安装/同步、覆盖 Taste 或启用额外 hooks。

**当前实现结构：** 绑定区复用共享26层角色；三类motion、工具和复用以可操作场景为主，API使用有限关系演示。收尾已统一为API → 目录/学习 → FAQ → Footer，学习区仍保留五任务/16条文档路由。检索与阅读不添加装饰动画，官方截图和步骤进入详情。网页不运行AE、不写Duik库文件；桌面完成范围以上方2026-11-04报告为准。

**阶段记录（2026-11-03）：** 22张墙体插画保留常驻标题/用途；原 Linearity 圆环组件重新接入父级三段滚动进度，复用工具台进入二级详情。绑定改为26层展开、归位、镜头推进与控制器接管；API 改为有限的宽幅关系演示。该阶段目录/学习的大插画索引已由下方最新阅读索引替代。文案、SSR 与客户端一起发布，不改角色；代码结果、视觉证据和后续待办统一见 [Plan 第0节](docs/LANDING_REDESIGN_PLAN.md) 和 [模板复用审查](docs/LANDING_EXPERIENCE_DESIGN.md#原模板能力审查2026-11-03)。

**首屏增量（2026-11-03）：** 导航首帧与 Vue 共用亮色中文结构，取消旧黑色渐变闪现；主渐变沿用原 shader，改为纸色底与可见的暖色/绿色流动。Hero 底部原条带已恢复并发布：八个 Duik 主面板图标、中文文档入口和暂停控制，沿用原横向循环与滚动退场。实际暂停/恢复、键盘文档跳转及退场焦点边界已验证；175 项测试通过、1 项可选浏览器检查跳过。Tools 已改为共享前后对照舞台，三类 motion 改为节奏对照、联动装置和分层山景；这些非首屏场景的视觉结果仍待验收。构建、3017服务、证据与边界见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)，不据首屏交付宣称整页完成。

**动效收尾（2026-11-03）：** Motion 改为等比画幅和紧凑控制带，参数展开不缩小画面、不遮挡主控件，主画幅90%可见后才自动演示；独立边缘光补齐后台/减少动态效果/卸载生命周期。该批 `landing:test` 为198项：197通过、1可选浏览器项跳过。真实鼠标已验证展开与播放/暂停共存；非首屏截图仍存在捕获位置不一致，圆环和整页视觉验收保持待办。当前真源、构建与本地入口仍按 [Plan §0](docs/LANDING_REDESIGN_PLAN.md) 管理。

**上一批增量（2026-11-03）：** 三张 Motion 卡片去掉重复的阅读/安装双按钮，圆环文档入口跟随当前内容；API 首层直接显示一行真实调用及对象/结果关系。修复交互后调整窗口不重测，以及测量宿主被500px占位截断的问题，保留原三阶段运镜公式。定向62项通过，实际一次 resize/reset 后轨道和 API 锚点正常；未重跑整页检查，也未改 Hero 横条。实现与构建记录见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-landing.mjs scripts/test-duik-api-cinema.mjs scripts/test-duik-capability-links.mjs scripts/test-duik-capability-resize.mjs
```

**阅读入口增量（2026-11-03）：** `/#toolkit` 的目录与学习区移除重复墙体插画，直接提供搜索、八类图标导航和五条阅读路线；保留33个工具入口、16条学习链接、关闭的官方截图详情。三步发布后定向测试50通过、1可选浏览器项跳过；实际指针/键盘操作确认分类、空态、五任务内容及Nextra裁剪文档导航。深滚动画面捕获仍异常，不据DOM结果宣称视觉通过。构建与服务状态见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-catalog.mjs scripts/test-duik-guide.mjs scripts/test-duik-landing.mjs
```

**圆环与图层增量（2026-11-03）：** 圆环五项选择移除额外固定滚动偏移，修正点第五项却落在第四项的问题，保留原运镜；图层工具在既有舞台内逐项整理预设名称，并同步组别、侧别和美术类型，不识图、不执行AE。已发布，定向96项通过，实际鼠标/Enter选择、图层拖拽、进度回退与有限播放已确认；完整非首屏视觉仍待验收。Hero八面板横条保持此前恢复结果，入口仍是 `/`。本批构建与服务记录见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-capability-selection.mjs scripts/test-duik-capability-resize.mjs scripts/test-duik-capability-links.mjs scripts/test-duik-tools.mjs scripts/test-duik-motion.mjs
```

**最新增量（2026-11-03）：** `/#tools` 恢复 Linearity 原双路径滚动描边，左右构图改为等尺度开放比较，首层合并为一组标题；原工具状态与有限播放不变。外围动效故障不会影响工具操作或清理，默认静态路径可读。本批定向55项通过；当前桌面确认画幅顶边一致、裁剪后参考点不动、真实滚动不改写结果。修正捕获坐标后已取得工具区清晰画面，但不代表完整圆环和整页镜头验收。Hero横条仍为八主面板入口，原根首页和3017端口不变，发布/构建证据见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-tools.mjs scripts/test-duik-tools-comparison.mjs scripts/test-duik-landing.mjs
```

**最新可见验收（2026-11-03）：** Hero 八面板横条保持原横向流动与滚动退场；当前桌面已取得 Motion 三场景及圆环飞入、汇聚、API 退场的清晰画面，并验证插值、联动拖拽、摄像机分层和圆环选择。圆环修正中文标题残影，以官方本地图标适配亮色，SSR/Vue 共用映射且重复发布不变。定向62项：61通过、1可选浏览器项跳过。仍不据此宣称完整角色组合或整页验收完成；最新发布、构建和画面证据见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-orbit-presentation.mjs scripts/test-duik-catalog.mjs scripts/test-duik-capability-links.mjs scripts/test-duik-capability-selection.mjs scripts/test-duik-capability-resize.mjs
```

**绑定交接增量（2026-11-03）：** 接管动作时同步控制器、关联层与网格，旧头部键盘焦点不再抢回新手部选择，镜头与Hero姿态保持独立。共享核心取消切阶段/复位后的陈旧拖拽，已由riglab同步工作台、组件和ZIP；26层原图未改。定向84项通过，实际桌面确认头部键盘→左手拖拽/微调、改姿重播、复位和打断后再次接管；取得根页角色与骨骼同屏画面。专项验证器的相对import与详情清理修复只做Node验证，不冒充浏览器通过。Hero八面板横条继续保留，入口仍是 `/`；构建记录、截图捕获差异和整页剩余项见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-duik-workflow.mjs scripts/test-character-rig.mjs scripts/test-character-input-cancel.mjs scripts/test-duik-validation-harness.mjs
python3 skills/character-rig-lab/scripts/riglab.py deploy --project output/riglab-demo --public public
npm run landing:publish
```

新增的输入与验证器回归已纳入`landing:test`；本批只运行上述定向集合，没有重跑全套或外部浏览器驱动。

**画布稳定性增量（2026-11-03）：** 共享角色核心把尺寸同步与绘制合并，同尺寸通知及离屏resize不再清空上一帧；Hero补齐运行期错误的静态原图回退与重试。默认首页没有诊断面板，必要时仅本地打开 `http://127.0.0.1:3017/?rig-diagnostics=1`，可读取当前实例buffer、模拟context loss并验证重试。实际已确认角色/控制器同屏、失效回退、重试和键盘微调；Hero底部八主面板横条的暂停/恢复、滚动隐藏及inert保持。批准角色与26层不变，完整拖拽/整页组合不由本批结果替代。定向测试、构建和证据见 [Plan §0](docs/LANDING_REDESIGN_PLAN.md)。

```bash
node --test scripts/test-character-render-lifecycle.mjs scripts/test-duik-hero-lifecycle.mjs scripts/test-duik-rig-diagnostics.mjs
```

**圆环偏好切换（2026-11-03）：** 初始或切入减少动态效果时释放横向轨道及spacer，恢复时按当前尺寸重建；与resize共用原有异步测量队列。原测量公式、三段运镜、五项手动选择与Hero横条不变。受控回归和实际浏览器证据分别记录，不把模拟media change称为系统偏好实测。

```bash
node --test scripts/test-duik-capability-resize.mjs scripts/test-duik-capability-selection.mjs scripts/test-duik-capability-links.mjs scripts/test-duik-orbit-presentation.mjs
```

### 文档预览与导航

文档入口为 `http://127.0.0.1:3017/docs`；贡献指南为 `/docs/advanced/contributing-guide`。旧 `/docs/docs/...` 地址永久跳转到 `/docs/...`。文档默认亮色，使用独立的 `duik-docs-theme` 存储，仍可切换深色；落地页固定亮色不受影响。

导航由 `content/_meta.cn.json` 的中文标签与固定 `upstream/mkdocs.yml` 的顺序生成；稀疏检出没有上游文件时读取 Git 中的快照，不联网刷新。正文链接按实际 MDX 文件目录和有效文档路由解析，目录首页不再依赖浏览器相对 URL 猜测。译文正文、版权、上游快照未改。

```bash
node --test scripts/test-docs-navigation.mjs scripts/test-docs-shell.mjs
DOCS_TEST_ORIGIN=http://127.0.0.1:3017 node --test scripts/test-docs-shell.mjs
```

第一条包含幂等导航生成检查（同内容重写 `_meta.js` 并核对 MDX 哈希）；第二条另验真实文章、中文控件、双前缀重定向。缺少 `DOCS_TEST_ORIGIN` 时 HTTP 项跳过，不代表已验收。

## 同步机制（摘要）

1. GitHub Actions 每周定时 / 手动触发，sparse checkout 上游 `src-docs` → 刷新 `upstream/`。
2. `scripts/sync-upstream.mjs` 对比 hash，更新 `translation-manifest.json`：
   - **已翻译文件永不被覆盖**，上游变更只标记 `stale`；
   - 未翻译占位文件可安全刷新。
3. 详情与冲突处理策略见 `PLAN.md` §3。

## 参与翻译

请先阅读 [`docs/TRANSLATING.md`](./docs/TRANSLATING.md)（翻译规范）与 [`docs/GLOSSARY.md`](./docs/GLOSSARY.md)（术语表）。

单文件为最小翻译单元；翻译完成后请在 `translation-manifest.json` 更新对应条目。

## 目录导航

- 产品首页 `/`
- 文档区 `/docs/*`（路径与上游 `src-docs/docs/` 一致，如 `/docs/guide/bones/autorig/leg`）

---

Copyright © RxLaboratory & contributors（上游原文）；中文译文贡献者见 git 历史。文档以 GFDL 1.3 分发。
