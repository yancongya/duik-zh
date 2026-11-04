---
关联文档:
  - ./LANDING_REDESIGN_PLAN.md
  - ./LANDING_CONTENT_AUDIT.md
  - ./CHARACTER_RIG_TEST.md
  - ./GLOSSARY.md
  - ../PLAN.md
  - ../README.md
涉及文件:
  - components/home/landing/
  - scripts/publish-duik-experience.mjs
  - scripts/validate-duik-experience.mjs
  - scripts/test-duik-guide.mjs
依赖服务:
  - duik-zh 本地 Next.js 预览服务（127.0.0.1:3017）
---

# Duik 落地页：产品能力与交互叙事方案

更新：2026-11-04。**本文件维护当前内容结构、交互契约与历史设计依据；当前交付、验收与剩余范围只在 [Plan §0](./LANDING_REDESIGN_PLAN.md#当前交付与剩余验收2026-11-04) 汇总。** 原根首页以简短文案和可操作场景为主，官方截图按需展开；收尾顺序为API → 开放式目录/学习 → FAQ → Footer。下列旧批次测试、截图限制和“未实现”描述保留时间边界，不覆盖后续实现或授权重建。独立候选继续暂停。

历史根首页基线（2026-11-01，**不代表本批验收**）：官方截图优先版曾以真实面板、AE 操作说明与文档为主，网页示例为辅；当时记录 60 项测试总计、59 通过、1 项可选 browser 跳过，初次 inspect 检测到 10 个模块且首页无错误，构建 137/137 页及 19 组桌面宿主检查通过。此前 39 项合约/单元、15 组宿主及 137 页构建属于更早一版。以上均不能覆盖 2026-11-02 的动态插画与场景改造；没有 AE 实机执行，手机尚未验收。

关联：[LANDING_REDESIGN_PLAN.md](./LANDING_REDESIGN_PLAN.md)（技术接入与分版验收）、[LANDING_CONTENT_AUDIT.md](./LANDING_CONTENT_AUDIT.md)（逐区事实、素材与文案审读）、[CHARACTER_RIG_TEST.md](./CHARACTER_RIG_TEST.md)（角色身份、组件及限幅）、[GLOSSARY.md](./GLOSSARY.md)（术语）、[PLAN.md](../PLAN.md)（项目规则）。
实现位置：`components/home/landing/` 为真源；三步 `npm run landing:publish` 输出本地 `/duik-experience/` 并同步 SSR/客户端结构、模块、插画/poster 与官方素材清单。发布、构建及最终浏览器记录由主集成统一负责；本批同步体验方案、README、AGENTS与Plan，不改正式技能、译文、上游或角色。预览仍为 `http://127.0.0.1:3017/`。

## 0. 当前整页范围与 Skills 分工

**2026-11-04最新覆盖：** 绑定区保持26层及原三镜头，首次滚入后连续演示一次，每镜头真实完成即推进，末镜头后持续交给用户控制。Tools以图层管理开场、裁剪降为最后入口；Tools/Motion/API/复用/墙/条带可见自动循环。全页无播放/暂停/重播按钮；交互/离屏/后台/reduced让位，阅读导航不轮播。介绍与绑定透明承接全页动态背景。当前实现/证据以Plan §0“绑定一次性连续演示与图层管理主展示”为准；旧单次手动及全循环日志仅作历史。

本轮仍在 `http://127.0.0.1:3017/`，22 槽功能入口墙与五段整页叙事均在已授权范围。封面和交互均不能只套装饰框；文案压缩为一个结果标题和一句说明，复杂步骤、官方截图及来源进入 details / 真实文档，承担次级证据。技术测试与视觉设计完成分开记录，最新实施/证据以 Plan §0 为准。

### 原模板能力审查（2026-11-03来源审读，2026-11-04适配说明）

以下为已读本地源码的结论，不把模板目录或截图当成已复用。Linearity 根为 `web-clone/sites/linearity/_nuxt/`；VoiceStudio 为 `web-clone/sites/voicestudio/`；MotionFun 为 `web-clone/.web-clone/jobs/motionfun-20261021/native/`。

| 原模块 / 实际能力 | Duik 当前适配 | 复用边界 / 证据入口 |
|---|---|---|
| Linearity `HomeCapabilitiesKP` + `HomeCapabilitiesTestimonialKP`：8图环绕飞入、左环右文、轮选、四分之一圈离场 | 原消费者曾被整个替换，父级进度悬空。现已恢复原组件、props/事件、三段时序与本地插画，普通复用工具台放详情 | 环绕进入/汇聚已有后续可见记录，见Plan §0；不能仅凭变换矩阵判完整通过，系统reduced-motion切换按用户决定保留未实测 |
| Linearity `HomeHowItWorksKP`：中央舞台左移、右侧说明上下进入、Lottie分段与stepProgress | 26原层展开/收拢/镜头推进/控制接管连为一次有限演示 | 拖拽后完整重播与姿态保留已有后续实测，见Plan §0；不照搬原700vh空停留，不外推AE自动绑定 |
| Linearity `HomeDifferenceKP`：双SVG路径沿滚动描边、等尺度前后比较与直接拖动；本身没有pin或穿梭镜头 | 四工具共用前后舞台、直接接管、图层标记和有限播放；外围双路径、等画幅开放排版与单组标题已接入 | 当前工具状态不重做；原全页背景注册不接入，避免改变相邻色场。滚动路径与参照对齐的分批证据见Plan §0 |
| Linearity `HomeCapabilitiesDiagramKP` 三子场景：横向穿梭与输入/处理/结果 | 已实现同路径纸飞机节奏、联动悬挂装置、三景层运镜；保留原父轨道和深色曲线，补齐resize重测与有限播放接管 | 剩余是完整横向运镜与跨区衔接的可靠可见验收，不再将历史“待重做”当成源码缺失 |
| VoiceStudio `app.js`：完整工作台切换、请求版本防竞态、视口/后台暂停 | 绑定与目录切换采用取消旧请求、图像解码后交接、直接接管 | 只借状态与生命周期；原媒体不可用，不宣称它提供完整音视频素材 |
| MotionFun `nodes/3.D2tY44El.js`：有种子对象布局、避让标题/导航/CTA | 可用于下一轮工具对象的空间布局 | 不复制无目的漂浮；编译副本不是独立组件库 |
| MotionFun `chunks/BQ7gwdws.js` PaintedShapeLayers：四层绘制显露、时间线/播放头同步 | 可用于“图层/动作序列”下一轮逐层显示与节奏映射 | 需继续读具体绘制器后适配；未落入本页，不能算完成 |
| MotionFun `chunks/DrdcAzG1.js`：进入视口播放、离屏暂停、reduced-motion禁用 | 仅播放生命周期参考 | 它不是运镜引擎；原副本远程媒体不引入本地落地页 |

本轮 Impeccable 用于降低首层文字负担，Taste 用于统一完整舞台，Emil animate 用于有限镜头与可中断交接。API/目录/学习已有新呈现；已实现项与最终可见验收保持独立。MotionFun条目仅为可选参考，不因尚未移植而新增板块或继续扩大范围。

| Skill | 本轮责任 | 不得越过的边界 |
|---|---|---|
| Impeccable | 删减重复面板与首层教程；以动态画面构建清晰层级，保留真实内容、焦点和验证证据 | 整页重做已获授权；不得虚构功能或把简单面板称为沉浸式完成 |
| Taste / design-taste-frontend | 在现有 22 槽几何内安排原创动态功能插画 fullbleed-v2、铺满构图与图下常驻标题/用途 | 不重排墙体、不生成假 AE UI；每槽是明确文档入口，插画不冒充软件执行结果 |
| Emil animate | 保护滚动错位/缩放与拖拽连续性；让横向 motion 使用足够大的功能舞台，自动预览可被清晰接管 | 拖拽释放不得误导航；不篡改 GSAP 测量值；聚焦播放按钮不能中断有限预览或让 click 暂停再次启动 |

### 同源入口契约

- **问题根因**：baseline payload filename 已是旧本地 SVG，SSR 仍是 Linearity `hero1..22.jpg`。旧发布按 payload 字符串替换漏掉 SSR；须按 DOM 槽位修复，不能只看配置已更新。
- **唯一映射**：`components/home/landing/hero-wall-scenes.mjs` 的 `heroWallScenes` 统一 22 项 `illustrated-fullbleed-v2` SVG、静态 WebP poster、title、summary 与本地文档目标；`hero-wall-art.mjs` 生成原创动态功能插画，`scripts/lib/landing-hero-wall.mjs` 同步 SSR、payload、常驻图下文字与链接语义。22 项是精选入口，不宣称有 22 个官方主面板。
- **动态与静态**：本地交付 22 SVG + 22 WebP；`adapter.js` 在卡片离屏、标签页隐藏、用户暂停或 reduced-motion 时切换真实 poster，不仅在父节点停 CSS。标题与一句用途不再依赖 hover；封面不含截图、假 UI 或新角色。
- **保留行为**：墙体布局、滚动错位/缩放、GSAP 时序和拖拽保持；批准角色、26 层、绑定核心、文档正文不动。
- **新点击行为**：普通点击/键盘激活以真实链接进入对应 `/docs/...`，交给本地 Nextra 文档路由；不再进入选中态或图片展开。发生拖拽时抑制该次释放引发的点击导航，不能牺牲拖拽换取可点击。
- **验证边界**：封面/标题/目标一致、链接可达、拖拽释放无误跳转、原滚动效果和不再展开图片均属于原首页验证范围；后续实际结果与未测边界统一见Plan §0，旧根首页或候选的报告不能代替。

**决策变更历史**：上一阶段“替换素材并保留点击展开、同步弹层”已被“功能入口直达文档”替代；中间的 18 张静态真实图 + 4 张动态示意、仅悬停标题，也已被 2026-11-02 的 22 张原创动态插画 + 常驻 title/summary 替代。保留旧诊断/证据，不把旧展开或截图优先行为列为当前不变量。此前生图 API 返回 **403 `Country/region not supported`**、未产出新图，是历史记录；本批插画由本地 SVG 源码生成，不借此宣称 API 生图成功。

**暂停的误选路线**：此前 `/landing-candidate.html` 有9项常规桌面检查，但reduced-motion问题未关闭，用户已停止该路线。文件/记录保留，不作为交付或预览入口；五段叙事在现有根首页持续推进，不恢复独立候选。

### 当前内容结构与能力边界（2026-11-04 源码对照）

此表说明实现，不重复维护验收清单；每批测试、浏览器范围与剩余项以 Plan §0 为准。

| 范围 | 当前主读线 / 交互 | 能力与证据边界 |
|---|---|---|
| 22 槽墙 | 原创动态插画 fullbleed-v2 + WebP poster，图下常驻标题/用途，保留原滚动/拖拽和文档入口 | 不含官方截图；旧墙 10 组结果不覆盖本版 |
| 墙中央标题 | 角色绑定／动画制作／日常创作，共用“都能更顺手。”；阶段配一句用途，不再叠加拆层流程和第二套总览标题 | `heroWallIntro`统一文案；SSR同步Vue的空前缀分支，原轮换时序不变 |
| 绑定 / motion | 已准备的26层角色展开、归位并恢复保存姿态、控制器接管；三类motion使用横向舞台，细参数默认收起；自动预览有限且可接管，摄像机三景层可拆合与拖拽 | 部位、关联层与控制器联动已实现；网页原理示意不是AE自动绑定或官方算法，不再列为“P1尚未实现” |
| Tools / Reuse | 四类工具共用比较舞台；复用首层保留原8图圆环与五项选择，选择→保存→取用工作台在二级详情 | 不修改AE工程，不读写OCO/duio，不执行脚本；取用结果保留独立`{id, frame}`快照，角色与素材身份不变 |
| API | 三真实调用共用一个几何关系舞台，首层调用只出现一次；4200ms有限播放、暂停、复位、阶段选择与进度拖动；运行前提/官方截图收入默认关闭的details | 不执行AE，不是完整API命名空间图；旧2400ms的8/8只属历史 |
| 学习 | 五任务、五主入口加11条后续链接；官方参考收进详情，指针有限反馈/键盘即时 | 保留原16条文档路由，不复制墙体大图；旧6/6只属当时版本 |
| 目录 / FAQ / Footer | 开放式检索保留八面板/33入口；截图按需展开；FAQ默认四问、其余七问可切换；移除页脚装饰图，保留安装/官方获取/归属 | 阅读区不额外加解释性动画，真实来源与软件/文档许可分别保留 |
| 整体衔接 | API → 目录/学习 → FAQ → Footer；SSR与Vue一致，重复发布不轮换；墙中央标题内容已统一 | 分段画面不外推整页连续过程；完成判断统一见Plan §0 |

### 历史批次实现与验证（2026-11-02）

以下“本轮/本批”和浏览器不可用均指2026-11-02当时，不代表当前能力或验收状态。

- 图片墙仍是模板原有22个图像槽；每个插画下方永久显示模块标题和一句用途，SSR 输出证实22组 caption 与22个本地文档链接。标题使用15px常规字重，说明12px并可换行；不依赖 hover。墙的视觉布局仍需浏览器实际检查，本轮没有这项证据。
- motion 三舞台改用600×360演示画布，外层随卡片可用宽度伸展；父级模板 gap 同步收紧，保留 GSAP 对实际父级尺寸的测量。自动化有轻晃/自然/活跃三个网页示例；曲线与精确参数默认收起。官方面板仍由用户展开查看。
- 自动预览的 pointerdown/focusin 对播放按钮不抢先反转状态；有限预览在聚焦后继续，实际激活播放/暂停按钮才切换到用户接管。自动化一次性演示不会因仅聚焦按钮变为无限循环。
- `npm run landing:test`：102 项总计，101 通过，0 失败，1 项可选 browser 跳过（不计通过），见 `output/landing-tests-motion-stage-final-2026-11-02.log`。新增受控 DOM 替身覆盖首次暂停和聚焦有限预览；它不是浏览器验收。
- `npm run build`：退出码0，137/137页，见 `output/landing-build-motion-stage-final-2026-11-02.log`；构建后3017已恢复，根路由HTTP200。发布日志 `output/landing-publish-motion-stage-final-2026-11-02.log`，`git diff --check` 通过。
- Browser 能力被 Work 设置禁用，本轮未截图、未验收视觉/水合/滚动；整页布局目标仍未完成。没有 commit/push/deploy。

## 历史根首页基线（2026-11-01 官方截图优先版）

以下表格及测试记录保留当时实现状态，**不是当前默认编排，也不覆盖本批改造**。

| 历史落点 | 当时已实现与发布内容 | 源码真源 | 当时验证边界 |
|---|---|---|---|
| Hero / 导航 | AE 工具集与非官方定位、原角色/可见控制器、六张官方 PNG 预览；新增“认识 Duik” | `content.mjs`、`hero-slot.mjs`、`adapter.js`、`preview-scenes.mjs` | 新版 Hero 拖拽/复位与导航宿主通过；角色身份不变 |
| `#inside-ae` / `#workflow` | 独立面板图与 AE 操作模型；骨骼/约束/控制器三阶段官方图，正常阅读 + 手动切换 | `orientation.mjs` / CSS | 不是700vh/7000px sticky；当时P1部位关联高亮未完整接入，后续已实现，见Plan §0 |
| `#tools` | 四类官方工具面板、准备/操作/结果及文档；Web 示例收进折叠 details | `tools-demo.mjs`、`tools-model.mjs`、`tools-demo.css` | 旧 tools 7 组是历史基线；新版折叠入口、真实图片与辅助操作通过 |
| 横向三 motion | 时间插值、Wiggle、摄像机官方参考为默认；可切曲线、参数信号和视差示意 | `motion-demo.mjs`、`motion-model.mjs`、`motion-demo.css` | 官方截图不是本次 AE 实机；示例不等于官方算法 |
| `#reuse` | OCO/动画/脚本三库真实截图、标签、步骤、图片放大/2x；笔记/自检文档 | `reuse-demo.mjs` / CSS | 不是库文件存取、保存应用或工程扫描 |
| `#toolkit` / 学习 | 八面板/33 精选入口、分类/检索/键盘、选中面板截图；五学习路径/16 入口 | `experience-catalog.mjs`、`tool-catalog.mjs`、`guide-experience.mjs` | 目录仅打开文档；原创路径插画不是 AE UI |
| `#api` | 三真实调用 + 官方脚本编辑器图 + API 初始化/进入运行态前提 | `experience-catalog.mjs`、`tool-catalog.mjs` | 仅复制片段，未执行 AE，不保证完整脚本即用 |
| FAQ / Footer | 11 问/3 组、筛选/收起/原生 details；学习闭环、官方获取及软件/文档许可分开 | `guide-experience.mjs` / CSS | guide 独立 10/10；不替代新版整页验收 |
| 共享结构 / 素材 | 10 kinds、20 模块/CSS；23 官方 PNG 与 8 官方 SVG 的独立来源清单 | `experience-layout.mjs`、`experience-vue.mjs`、`experience-mount.mjs`、`official-media/`、`icons/` | 固定 SHA/署名/字节校验；23 张归档不等于全部用于首页 |

### 历史根首页验收记录：证据不外推到新墙或整页改造

- 当时合约/单元：主集成记录 **60 项总计、59 通过、1 项可选 browser 跳过**，跳过不算通过；guide 独立 10/10 不与总数重复相加。
- 素材与内容：23 PNG 文件存在且 SHA-256 与清单一致；48 个 MDX 路径和 4 个文档关联无缺失，见审读表。属于来源/静态检查，不是浏览器或 AE 结果。
- 初次 inspect：**10 个共享体验模块，首页无错误**；只是诊断，不说明所有交互/链接已通过。
- **集成修复及复核：通过。** workflow 懒图曾使区块晚增高约 54.8px；补充固有尺寸并给 figure 预留 `min-height:475px` 后，冷启动首次工具导航落点为 83.703125px，满足 84±2px。Vue 滚动重写 class 曾使旧模板导航露出；改用 `header[data-duik-ready=true]` 后，实际滚动检查确认只显示 Duik 导航，旧 Logo / login 均隐藏。
- **官方截图优先版桌面宿主：当时范围通过。** 实际 `3017 /`、1440×1000 完成19组检查（18组首页 + 1组 Nextra 导航），`scopedPass=true`，首页错误、失败请求和外联均为0；23张资源均返回真实 PNG。Nextra 裁剪文档跳转 HTTP 200；文档区仍请求官方 MP4，因此 `docsResourcesPassed=false`，不声明全站离线。最终报告归档 `output/duik-experience-check/report-official-panels-2026-11-01.json`（会话20819、退出码0），与其他版证据分开。
- **官方截图优先版构建：当时通过。** 主集成 `npm run build` 会话 75705、退出码 0、137/137 页；日志 `output/duik-landing-build-2026-11-01-official-panels.log`。当时恢复本地 3017 dev（会话 85547），19 组定向桌面宿主检查通过；历史会话不证明当前服务状态。
- **手机/跨断点：未验收；AE：未执行。** 官方历史截图、网页示意和复制结果不能证明当前 AE 行为、官方算法或兼容性。

### 上一版结果归档：不能套用到当前版

- 旧 Web 演示优先版：39 项合约/单元通过；catalog 独立 9/9（8 合约 + 1 浏览器），不与 39 重复相加；复制分支用受控剪贴板替身。
- 旧 tools：`output/duik-tools-check/report.json` 7 组通过、裁剪参考点 delta `{x:0,y:0}`；旧 motion：`output/playwright/motion-browser-report.json` 5 组通过，含实例隔离/离屏/键盘/reduced-motion。
- 旧实际首页：`3017 /`、1440×1000 的 15 组通过，旧 `output/duik-experience-check/report.json` 为 `scopedPass=true`、首页错误/失败请求/外联为空、Nextra 导航 HTTP 200。同名报告会更新，旧文本不能当新证据。
- 旧构建：2026-11-01 会话 77901，退出码 0、137/137 页；多 lockfile workspace-root 警告保留，随后 dev 会话 21835 恢复预览。此构建发生在本轮官方截图改版之前。
- 文档区既有 favicon 404、官方视频/CC 许可外联及历史跨断点 GSAP 边界不因旧首页通过而关闭；不承诺全站离线。详细分版记录见 Plan §5.3。

## 1. 根首页改造依据与本次整页边界

本轮目标是围绕 **Duik 的绑定、动画、自动化、通用工具与 API** 建立可信的理解和学习入口：先通过大舞台的可见效果与直接操作理解任务，再按需查看官方界面、AE 步骤与文档。网页示意承担解释，不冒充真实 Duik 或 AE 执行；“先看官方截图”的旧主次关系已被替代。

沿用原角色、26层、共用核心、亮色、本地发布基线和SSR修复；绑定、Tools与三类motion前置操作场景，复用首层保留原圆环，样本工作台与官方参考进入详情。API的三调用关系舞台、开放目录与五条学习路线均已发布；最新可见验收与剩余组合见Plan §0，不把局部实现当成整页完成。保留适用的本地横向动效，但已移除原绑定长sticky，不声称原滚动布局全数保留。

定位保持：**Duik Ángela 非官方中文文档站，为 After Effects 使用者提供工具理解与学习入口。** 不是浏览器版 Duik、在线自动绑定服务、AI 生图器、团队资产平台或 AE 替代品。

当前Hero轮换词与可访问摘要由`content.mjs`统一提供；摘要及软件说明为：

> 在角色动画、动态图形和日常创作中，用 Duik 工具打磨创意与细节。
> Duik Ángela 是运行在 After Effects 中的脚本工具集。这里提供非官方中文指南，帮助你了解绑定、动画、自动化，以及合成、图层和脚本工具。

主动作仍为“阅读中文文档”，次动作为“查看安装方法”。导航为 **认识 Duik / 角色绑定 / 通用工具 / 工具总览 / 脚本 API / 安装指南**，对应 `#inside-ae`、`#workflow`、`#tools`、`#toolkit`、`#api` 和安装文档。工具导航与冷启动定位的既有通过记录属于 2026-11-01 基线；本批结果由主集成另记。

## 2. 证据范围与不能外推的内容

已补充官方 Markdown 核对：来源仅为 **RxLaboratory/Duik GitHub** 的 `src-docs/mkdocs.yml` 与 `src-docs/docs/**/*.md`，不是 duik.org HTML。核对日期 **2026-11-01**；当次默认分支 `master` 固定到提交 **`718e6e282d1ae91dc9678bb1a202ce08e862a28d`**，提交时间 **2026-02-19 09:10:18 UTC**，提交消息 `update credits`。以下官方源链接均固定该 SHA，不使用浮动 master 链接。

固定提交日期不等于所有文档的更新日期，也不代表已在最新 AE/Duik 版本逐项实机验证。本地中文 `content/docs/` 用于术语与站内落点；未修改译文或创建/刷新 `upstream/`。官方面板范围以 [first-look][O01]，文档导航关系以 [mkdocs.yml][O02]，具体能力以对应 Markdown 正文为准。

- “管理”有明确依据：图层创建/命名/标记，控制器选择/显隐，动画库、元绑定库、脚本库，项目自检和笔记。不能扩写成云端协作、任务看板、版本管理、自动资产同步或权限管理。
- **“管理”是本站按任务归纳的能力域，不是官方第九大面板；API 也是 Advanced 文档下的开发入口，不是顶栏第九项。** 八大面板、辅助按钮、文档章节与 API 命名空间是不同层级，不能合并计数。
- 动画库文档含 2023/2024 年的格式和未来计划说明；首页不据此宣称当前已支持自动跨比例重定向、OKA 或新的兼容版本。
- API 入门使用 `Duik_api.jsxinc`，无头脚本页使用 `DuAEF_Duik_api.jsxinc`；存在版本/示例差异。未核对实际 API 包及 AE 执行前，只展示已证实的调用片段，不交付“复制即运行”的完整脚本。
- Link Art 文档对默认匹配方式及 Alt 行为的段落存在不一致。本页可说明按名称/距离匹配的概念，不硬编码哪个是当前默认。
- 本站角色表情与头发控件来自 Web 演示核心；不能据此暗示 Duik 会从一张图自动生成完整面部绑定。

## 3. 真实能力 → 用户任务

| 页面能力域 | 本地文档确认的能力 | 用户任务 | 不应暗示 | 主要依据 |
|---|---|---|---|---|
| 绑定：建立驱动结构 | 骨骼驱动美术层；Link Art；自动绑定生成约束与控制器；可使用底层工具调整 | “我已有分层角色，怎样让手部目标带动手臂？” | 上传单张图即可自动拆层、任意角色一键完美绑定 | R01–R04 |
| 动画：控制时间与动作 | 关键帧、时间/空间插值、补间、程序化动画、循环等 | “姿势已经对了，怎样改变运动节奏？” | Web easing 就是 Duik/AE 的完整插值计算；现有角色支持所有动作 | R05–R07 |
| 管理：保持结构清楚 | 图层名称/组别/侧别/类型标记；控制器选择与显隐；重命名；自检 | “图层变多后，怎样找到当前要改的东西？” | 云端工程管理或自动修复任何项目问题 | R08–R11 |
| 复用：把成果留下 | 动画库保存/分类/应用；OCO 元绑定库；脚本库 | “下一次不用从零整理，哪些成果可以保存再用？” | 浏览器姿态 JSON 就是 OCO/duio；跨角色自动适配 | R12–R14 |
| 通用工具：减少零碎操作 | 裁剪预合成且保持父合成位置；批量合成设置；查找替换；表达式与脚本工具 | “不是在绑定角色，也有哪些工作能少做几步？” | 仅靠这个网页就能修改本机 AE 工程或表达式 | R15–R17 |
| API：组合已有能力 | ExtendScript API；命名空间；初始化；无 UI 脚本；AE 快捷键 | “怎样把常用操作接进我自己的脚本？” | Node/npm SDK、HTTP 服务、浏览器执行 ExtendScript、系统终端 CLI | R18–R21 |

### 3.1 官方八大面板 → 能力域 → 演示 → 文档

官方顶栏的八项见 [first-look.md 原文 L56–L63][O01]。下表保留官方名称、能力层级与边界；主叙事以任务场景为先，官方面板图、AE 操作步骤和完整八项导航作为次级依据。没有制作 Web 演示的功能不因此被删除或伪造为已执行。

| 官方面板 | 首页能力域 | 本轮结果 / 尚未覆盖边界 | 中文文档落点 | 官方依据 |
|---|---|---|---|---|
| Bones / 骨骼 | 绑定结构 | 同一 26 层角色的拆分/关联/控制场景；bones 原图、准备步骤与 Link Art 工具栏归属收进详情；不是 AE 创建骨骼 | `/docs/guide/bones`、`/docs/guide/rigging` | [first-look][O01]；[mkdocs][O02] |
| Links and constraints / 链接与约束 | 驱动关系 | 真实角色部位、网格与控制器响应前置；constraints 原图与步骤为次级；双臂 IK 不代替父子约束、连接器、图钉全范围 | `/docs/guide/constraints`、`/docs/guide/constraints/kinematics` | [first-look][O01]；[mkdocs][O02] |
| Controllers / 控制器 | 操作接口与管理 | Hero 和绑定舞台保留可见控制器；controllers 原图与步骤按需展开；PNG 选择/显隐不是创建、烘焙 AE 控制器 | `/docs/guide/controllers`、`/docs/guide/controllers/tools/show-hide` | [first-look][O01]；[mkdocs][O02] |
| Automation & expressions / 自动化与表达式 | 程序化动画、属性与表达式处理 | Wiggle 效果与参数接管前置，官方原图/步骤次级；确定性信号不是官方随机/表达式算法，引用比较未做 | `/docs/guide/automation`、`/docs/guide/automation/wiggle`、`/docs/guide/automation/tools/expressions-tools` | [Automation][O03]；[Expression tools][O04] |
| Animation / 动画 | 关键帧与节奏 | 动作节奏、曲线与暂停/复位前置，原图和关键帧步骤次级；不是 Duik Bézier 编辑器；复用区提供静帧分镜，不操作库文件 | `/docs/guide/animation`、`/docs/guide/animation/interpolation`、`/docs/guide/animation/anim-library` | [Animation][O05] |
| Camera / 摄像机 | 场景与镜头 | 三个本地独立景层可拆合、拖拽视点产生真实相对位移；原图与步骤次级；网页比例不是 Duik 官方默认值 | `/docs/guide/camera`、`/docs/guide/camera/camera-2d`、`/docs/guide/camera/tools/frame` | [Camera][O06] |
| Tools / 通用工具 | 合成、图层、文本、脚本与表达式 | 四类可操作大舞台前置，真实面板/步骤收进 details；批量合成设置另列，不与蒙版裁剪混写 | `/docs/guide/tools` 及下列四类具体文档 | [General Tools][O07] |
| Command Line and Feature Library / 命令行与功能库 | 快速发现工具 | 命令面板原图与 `#toolkit` 八分类/33 精选入口；中英文过滤、方向键/Enter/Esc 仅打开文档，不在网页执行 AE | `/docs/guide/cmd` | [first-look][O01]；[Command][O08] |

八项中的最后一项是一个“命令行与功能库”面板，不拆成两类，也不是 Settings。首页需要让八项都有清楚的介绍与真实文档入口；尚未制作可操作演示的面板明确显示“阅读工具文档”，不摆放假按钮。

### 3.2 Tools 的四类不能缩成一张骨骼图

[General Tools][O07] 明确列出四个标签页，并说明这些工具不一定直接服务绑定或动画：

| 官方分类 | 已核实能力 | 首页素材与交互 | 中文文档落点 |
|---|---|---|---|
| Composition / 合成 | 按蒙版边界裁剪预合成、保留父合成位置；批量合成/嵌套设置是另一工具。[O17]、[O18] | 裁剪舞台一次性解释、可直接拖动角点接管；参考点说明位置保持，`comp-tools.png` / 步骤收进详情 | `/docs/guide/tools/composition/crop`、`/docs/guide/tools/composition/settings` |
| Layer / 图层 | AE 图层创建、重命名、组别/侧别/类型/名称标记。[O16] | 同一几何构图内逐项整理预设名称，所选层联动四字段；保留拖拽、回退与复位。26 PNG角色筛选、`layer-tools.png`与步骤收进详情，不冒充AE写入或自动识图 | `/docs/guide/tools/layers` |
| Text / 文本 | 重命名；在名称、表达式、文本层源文本内查找替换。[O19]、[O20] | 批量名称流、查找替换与应用/撤销网页样本前置；原图/步骤收进详情，不改 AE 工程或表达式引用 | `/docs/guide/tools/text/rename`、`/docs/guide/tools/text/search-replace` |
| Scripting and Expressions / 脚本与表达式 | 脚本库、脚本化表达式、编辑器、编辑表达式。[O07]、[O13] | 片段取用场景前置；完整编辑器、`script-tools.png` / `script-editor.png`、步骤和文档为次级，不声称执行 | `/docs/guide/tools/scripting/library`、`/docs/guide/tools/scripting/scriptify-expression`、`/docs/guide/tools/scripting/script-editor`、`/docs/guide/tools/scripting/edit-expression` |

Automation 面板中的表达式工具侧重程序化动画中的属性、数值和表达式处理；Tools 的脚本与表达式标签是通用脚本/编辑工作流。二者相关但不能合并抹去官方面板边界。[O03]、[O07]

### 3.3 辅助入口、库与开发能力的层级

| 项目 | 官方位置与性质 | 首页处理方式 | 中文落点 / 官方依据 |
|---|---|---|---|
| 笔记编辑器 | first-look 的顶栏右侧按钮；通用、项目、合成笔记 | 复用区保留真实文档入口与保存范围说明；不做协同笔记/云文档 | `/docs/guide/notes`；[first-look][O01]、[Notes][O09] |
| 自检（Sanity） | 底栏状态图标与详细检查入口 | 当前提供真实文档说明/入口；重复名称样本仍未做，不对未读 AE 项目亮“全部通过” | `/docs/guide/sanity`；[Sanity][O10] |
| OCO 元绑定库 | User Guide 独立章节；OCO Panel 不属于八项顶栏 | 结构样本选择 → 本页示例库 → 取用；`oco_panel.png` / 步骤/放大收进详情，不硬补第九主面板或读写 OCO | `/docs/guide/oco`；[mkdocs][O02]、[OCO][O11] |
| 动画库 | Animation 下的功能 | 原角色三帧分镜可在本页内存保存/取用；`anim-library.png` / 步骤次级，不是 Duik 动画文件或官方插值 | `/docs/guide/animation/anim-library`；[Animation Library][O12] |
| 脚本库 | Tools → Scripting and Expressions | 真实调用片段可存入/取用网页示例库；`script-lib.png` / 步骤次级，不扫描文件或执行 AE 脚本 | `/docs/guide/tools/scripting/library`；[Script Library][O13] |
| API | Advanced → Duik API | 三真实调用切换同一几何关系舞台；可播放/暂停、复位、选阶段和拖动进度；运行前提与官方编辑器图收进默认关闭的 details；完整命名空间图未做 | `/docs/advanced/api`；[mkdocs][O02]、[API][O14]、[API Features][O15] |

Command 面板的官方交互包括分类过滤、空格进入分类、Enter 运行命令、双击条目；`Duik Cmd.jsx` 可作为独立可停靠面板。[O08] **首页只借鉴发现/导航方式**：Enter 打开对应文档，界面明确写“工具文档检索”，不改回 Hero 的生成式输入框。

### 3.4 历史缺口与本轮处理结果

以下是早期改造原因，不能继续概括为“当前整个工具体系缺失”：

1. 八面板，特别是 Automation & expressions、Tools 四类、Command/Feature Library，原先缺清楚入口；现在目录/官方面板/步骤已覆盖。
2. 早期非绑定能力缺任务语义；2026-11-01 曾改为官方截图优先，本批已改为任务效果/直接操作优先，真实官方面板与 AE 步骤保留为次级证据，网页边界仍明确。
3. Camera现有三景层拆合/视差场景；Notes/Sanity/OCO/动画库/脚本库保留准确层级。复用首层为原圆环与五项文档入口；三库的本页样本保存/取用、截图、步骤和放大均在详情。
4. API 保留三真实调用与初始化/进入运行态前提，主画面已改为对象 → 调用 → 能力的单几何关系舞台；运行前提、官方编辑器图进入默认关闭的 details，仍不执行 AE。

八面板/33入口、五路径/16入口、FAQ/Footer与API是已有内容基线；墙、绑定、motion、Tools、Reuse已更新主次与交互，API单几何关系舞台、目录与学习改版均已发布。旧60项/59通过/1跳过、10模块inspect、137页构建及19组桌面结果均只属历史。绑定联动的当前证据与全页衔接边界见Plan §0；相对/绝对引用比较、批量设置、真实库文件存取、重复名称自检和完整API命名空间图没有在网页实现，不把这些扩展项误写为本轮承诺。

## 4. 历史六张角色分镜的局限与当前用途

现有 `scenes.mjs` 包含 `assembled`、`layers`、`controllers`、`ik`、`expression`、`animation` 六张真实同源渲染，解决了角色一致性和本地资产问题，继续保留。它们不能独自承担整页叙事：

1. 这六张图主要是同一角色的不同视图；反复放进流程、能力、管理和 API 区，会让不同能力看起来只是“换个姿势”。
2. 静帧、淡入和 hover 换图能表现状态，却不能说明选择哪个图层、改了什么参数、为什么得到某个结果。
3. “拆层→骨骼→动作”覆盖了绑定外观，未呈现图层标记、动画复用、合成工具或脚本扩展。
4. 控制器图片不等于可操作控制器；管理面板的图片也不等于筛选、选择与恢复真的有效。
5. Web 表情、头发和 IK 实现容易被误读为 Duik 完整功能演示，必须标明宿主与能力边界。
6. 同一种卡片、相同幅度的缩放/漂浮会掩盖任务差异；更需要图层列表、时间曲线、合成边界、代码片段等不同证据。

当前策略：保留六张同角色WebP与六张原创SVG的源文件/归档；Reuse二级工作台从既有真实角色捕获中复用结构图与静帧分镜，不另造角色，也不把分镜当官方动画插值。Hero六预览仍有`preview-scenes.mjs`的官方PNG映射，但不是22槽墙；新墙使用原创SVG动态插画。绑定、Tools、motion以可操作场景为主，复用首层保留原圆环，官方面板/步骤按需展开。原角色在Hero、绑定和图层详情共用原26层与核心，身份不变。

## 5. 当前整页方向：五段场景逐区推进

整页已按**角色绑定 → 动画节奏 → 日常工具 → 资产复用 → 进阶 API / 学习**逐区推进；每段一标题、一句短说明，来源与操作详情进入文档/展开层，八大面板保留为次级入口。此前“本批只做 22 槽墙”的限制已被最新整页授权替代；不因此恢复独立候选或更换根路由。实现状态与最终宿主验收分开记录。

| 场景 | 主画面 / 可理解的变化 | 简短主读线与次级信息 | 实现边界 |
|---|---|---|---|
| 角色绑定 | 已准备的26层角色展开→归位并恢复保存姿态→控制；真实部位图层/网格/彩色控制器响应，复用原核心 | 一标题一句说明；骨骼/约束/控制器及Link Art来源进入展开层与绑定文档 | 联动和完整重播已实现；浏览器范围见Plan §0，不是AE自动绑定 |
| 动画节奏 | 同路径对象比较节奏、位置/旋转/缩放联动、三景层摄像机；有限预览后用户接管 | 插值/自动化/摄像机分类与官方面板作次级说明；可暂停/复位，不假称官方算法 | 三舞台与父级横向轨道已接入；分段与连续证据分开，见Plan §0 |
| 日常工具 | 裁剪角点、预设图层名称/标记、批量名称流与片段取用四类比较舞台 | 先看任务结果；26层筛选/显隐、完整编辑器、官方面板与精确调整按需展开 | 不操作AE工程；保留同画幅与参考点，不把详情误写为首层 |
| 资产复用 | 原8图圆环汇聚与五项选择；二级工作台使用原角色结构图、静帧分镜与真实代码片段 | 选择、保存、取用为三个独立状态；取用固定`{id, frame}`快照，截图与格式边界进入详情/文档 | 仅保存当前网页内存样本；不导入/写入OCO、duio或运行脚本 |
| 进阶 API / 学习 | API三真实调用共用关系舞台；学习区五主入口加11条后续链接 | API有限时间线可接管/暂停/复位；学习指针180ms反馈、键盘即时；前提与官方图进入关闭details | 已实现；旧API8/8、学习6/6仅作历史，当前证据见Plan §0 |

**八大面板分类保留，但降为次级目录/搜索或展开层**，不对应八块教程。§3 官方能力矩阵、§9 的 R01–R23 与 §10 固定来源继续作为事实真源，不要求全部截图同时出现在主画面。22 槽原创动态插画解释功能并导向文档，批准角色用于绑定体验；官方截图在 details / 文档承担次级证据，不把新插画说成官方界面。

**证据分开**：2026-11-01 根首页 60 项/19 组/137 页、已暂停候选的 9 项常规桌面检查、中间墙版本的旧 10 组、本批动态插画与场景改造是不同范围。候选仍有 reduced-motion 问题，不能标完整；本批需另记原滚动/拖拽、22 项 SVG/poster/title/summary/文档对应及各新场景结果，不沿用旧通过记录或继续修候选。

根首页沿用共享 kinds / 模块发布结构，历史基线见顶部表与 Plan §5.2。历史横向修正记录也保留：父级 gap `clamp(96px,12vw,220px)`、距离因子 `1.6 → 1.1`、hold 约 `0.3 viewport`；当时 1440×1000 下 13786→9178px，约减 33%。这不是本批验收或擅自修改滚动参数的理由；墙的 GSAP 行为保持不动。以下 §5.1–§5.3 说明当前实现与 AE 边界。

### 5.1 绑定演示不伪造自动绑定

当前三阶段使用**同一个已准备的26层角色展开、归位并恢复保存姿态、控制器接管**，部位选择、关联图层、网格与彩色控件由真实共享核心响应；自动推进同时等待最低停留和当前镜头实际完成，用户输入可中断旧演示。官方骨骼/约束/控制器图与步骤进入展开层，“链接图形（Link Art）”仍属于骨骼工具栏。P1的部位与关联层联动已实现，拖拽/完整重播等当前证据见Plan §0；不是现场执行AE自动绑定。要证明AE结果，须另用可核对的AE + Duik录制并交代素材/骨骼准备，不靠切预制图制造成功。

Hero 的 hover 为轻微邀请动作；真实拖拽后不抢夺目标。用户复位才回到初始姿态；离屏暂停，回来不强制重播。每实例状态隔离，不用全局姿态把上下区块意外联动。

### 5.2 管理演示有真实状态，但不修改用户工程

`#tools` 图层首层现在复用同一几何构图，以3300ms有限播放头逐项整理预设名称，显示所选层的名称、组别、侧别与“美术（Art）”类型；选层、拖拽和进度回退同步标签，不增加独立计时器。此处不是图像识别或Duik命名算法复刻。真实26 PNG角色的筛选/显隐、官方Layer Tools与AE步骤位于默认关闭详情；PNG、美术组、骨骼和控制器不混称“26个AE图层”。旧独立/首页验证不证明本批首层已完成视觉验收。

文本类前置批量名称流与字面查找替换、应用/撤销，官方面板/rename 图与步骤进入详情；不更新 AE 表达式引用或扫描工程，重复名称自检样本尚未做。三库已支持当前网页内存中的样本保存/取用与复位，动作素材是原角色静帧分镜；官方截图/步骤/放大仍可展开。**网页样本保存不等于 OCO/duio 文件读写、导入、AE 应用或脚本执行**，刷新后不保留样本库。

### 5.3 API 单舞台解释调用，不执行 AE

`api-cinema.mjs` 将三种调用放在同一个几何关系舞台，由首页布局与挂载入口直接接入；`experience-catalog.mjs` 仅保留重导出。`tool-catalog.mjs` 的真实调用、选择对象前提与文档目标保持不变。选择手臂、抖动或自动父子关系时，输入/结果图形、代码和说明同步切换，不再以三张静态调用卡或大幅编辑器截图承担首层叙事。

- **真实交互**：播放/暂停、复位、阶段按钮（选择对象 / 调用片段 / 能力示意）及进度滑杆控制同一时间线；拖动的是示意进度，不是新增可绑定角色或 AE 控制器。
- **有限动效**：当前一次播放 4.2 秒（`apiCinemaDuration = 4200`），由 WAAPI 驱动几何图形的 transform / opacity，rAF 只同步进度。未被用户接管时，首次进入可见区域可解释一次；离屏或页面后台暂停，不无限循环，也不自动反复抢回进度。reduced-motion 保留静态结果与手动阶段/进度查看，禁用播放。
- **素材与能力边界**：原创本地 SVG 仅说明选中对象、调用与结果的关系；手臂图不是原角色的新绑定，抖动轨迹不是 Duik 随机算法，父子关系不是对 AE 图层执行操作。原 26 层角色、既有素材身份和绑定核心不变，不新增远端运行时或动画依赖。
- **证据状态**：历史API **8/8**（`output/playwright/api-scenes-final/report.json`）属于2400ms版本，学习 **6/6**（`output/playwright/learning-paths/report.json`）也仅代表当时版本；不能称为当前实现的最新验收。当前4200ms及首层调用去重的代码回归为14/14，本批发布、构建与实际浏览器结果统一见 [Plan §0](./LANDING_REDESIGN_PLAN.md#当前交付与剩余验收2026-11-04)。API后台分支的受控模拟不等于物理切换标签页；以上不外推整页设计或AE实机验收。

| 任务 | 文档中的调用片段 | 先决条件和按钮行为 |
|---|---|---|
| 为手臂骨骼创建绑定 | `Duik.Rig.arm();` | 在 AE 中准备/选择相应骨骼，并已正确引入与初始化 API；“复制调用片段”不是运行按钮 |
| 建立自动父子关系 | `Duik.Constraint.autoParent();` | AE 中选择相关图层；示例以最后选择的图层作父级；详情跳转无头脚本文档 |
| 添加抖动控制 | `Duik.Automation.wiggle();` | AE 中选择目标属性；默认调用见 API 功能文档，不虚构参数表 |

默认关闭的“调用代码与运行前提” details 保留以下说明：AE ExtendScript 调用片段，需按版本正确引入 API，执行 `DuAEF.init()`；若不使用 `DuScriptUI.showUI()`，必须在功能调用前执行 `DuAEF.enterRunTime()`。同时满足该例的骨骼/属性/图层选择前提。官方脚本编辑器原图也在该 details 内，不用未核对 include 文件名拼出“复制即用”完整脚本，不虚构终端 CLI、npm 包或 HTTP endpoint。Duik Command 是 AE 内面板，网页只导航文档。

API单几何舞台与学习区已发布；历史定向8/8和6/6不作为当前整页完成证明。完整 API 命名空间图仍未制作。后续制作时只使用真实名称与任务归属：`Duik.Bone` / `Duik.Rig` / `Duik.Constraint` / `Duik.Controller`（绑定）、`Duik.Animation` / `Duik.Automation`（动画）、`Duik.Layer`（图层）、`Duik.Tool`（通用工具），以及 `Duik.Camera`、`Duik.Pin`、**`Duik.CmdLib`**；依据 [API Features][O15] 与 R19。不创造 `Duik.Management`。当前单舞台的三个调用不代表完整图谱。

命名空间与面板是“主要对应、存在交叉”，不是严格一一映射：官方 API 功能页在 Automation 示例中列 NLA，而 UI 文档导航将 NLA 放在 Animation。该页的 `Duik.CmdLib` 链接还误指 `Duik.Camera.html`；首页保留真实命名空间名，但不复制错误链接，先指向本站 API 功能说明。

## 6. 素材生产与实现边界

当前主画面由本地原创动态功能插画、锁定角色与可操作网页场景承担；官方文档截图仍可追溯，主要放在 details / 文档作为次级证据。原创画面不冒充软件界面、官方算法或 AE 输出。

| 资产类型 | 来源与交付物 | 当前用途 | 禁止替代 |
|---|---|---|---|
| 功能入口墙插画 | `hero-wall-art.mjs` / `hero-wall-scenes.mjs`，`illustrated-fullbleed-v2`：22 原创 SVG + 22 WebP poster | 原 22 槽几何内铺满；每图下常驻 title + summary；静帧覆盖暂停/离屏/减弱动态 | 截图墙、假 AE UI、新角色、官方算法或 AE 执行结果 |
| 锁定角色与层级 | 原图、26 张透明层、rig 数据、共用核心/限幅 | Hero、拆分/关联/控制三阶段与图层舞台；复用原角色分镜 | 重生人脸/造型，整图冒充分层绑定 |
| 官方文档截图 | 23 张 PNG；`official-media/sources.json` 固定 SHA、路径/署名及 SHA-256；发布 `/duik-experience/official/` | 详情/文档的次级证据；API 原图收入默认关闭的 details；已有 Hero 预览、认识/目录材料与新墙分开，不把旧材料宣称整页新设计完成 | 不是本次 AE 捕获，不保证当前版本 UI；不去掉署名/旧版本说明；不得放回 22 槽插画墙 |
| 官方图标 | `icons/` 12张原始SVG：八主面板与四辅助图标，独立清单/字节校验 | Hero横条、目录、辅助入口与学习任务；八主面板仍是八项，不按资源数增添分类 | 重绘冒充原图，改标MIT/CC0 |
| 网页状态与曲线 | 确定性状态、SVG 曲线/几何/独立景层；明确“网页示意” | Tools 与 motion 主场景，直接接管、暂停/复位；不是默认折叠的旧辅助例 | 称为 Duik Bézier/随机算法/默认参数或 AE 实机操作 |
| 历史阅读路径插画 | 原创轻量SVG的既有文件，内容来自本地文档任务 | 保留来源追踪；当前学习首层使用五任务导航、官方小图标和文档链接，不再铺重复大图 | 将历史插画写成当前学习封面，或冒充AE UI/真实软件截图 |
| 开发素材 | `api-cinema.mjs`的原创几何SVG / 4.2秒有限时间线；`tool-catalog.mjs`的三真实调用、前提与来源；官方script-editor图 | API单舞台切换、播放/暂停、复位、阶段/进度控制与片段复制；首层调用只出现一次，运行前提/官方图在关闭details | 发明API、参数、命令、执行日志，或将几何示意当作AE输出/官方算法 |
| 原角色分镜 / 历史回退 | 原六同源角色 WebP、六原创工具 SVG 及文字摘要保留 | Reuse 使用原角色真实结构图/静帧分镜；其余材料保留追踪，不是当前 22 槽墙 | 静帧分镜冒充官方插值、新角色或 AE 动画文件 |
| 未来 AE 实机证据 | 获准 AE 环境录屏、版本、操作和素材许可 | 证明真实自动绑定或 AE 特有行为时再制作 | 把官方历史截图或网页录像当本次 AE 验证 |

23 张 PNG 来自 RxLaboratory/Duik 固定提交 `718e6e282d1ae91dc9678bb1a202ce08e862a28d`，作者为 Nicolas “Duduf” Dufresne / RxLaboratory and contributors，保留文档 GFDL 1.3 语境。可能有英文/旧版本号；文件/哈希已核对，具体清单见审读表与来源文件。

源归 `components/home/landing/`。`experience-layout.mjs` 共用 Node SSR/Vue 结构，`experience-vue.mjs` 接本地 Vue，`experience-mount.mjs` 挂载/清理；orientation、tools、motion、reuse、catalog/API、guide 分工。三步发布为 `publish-duik-landing.mjs` → `patch-duik-landing-visuals.mjs` → `publish-duik-experience.mjs`；统一输出模块/CSS、22 SVG/22 poster、官方 PNG/图标/清单并同步共享 kind。只跑前两步会留下中间旧槽位，public 不是真源。

所有首页素材均本地同源，不加镜像/远端运行时/新后台。Tools 使用原生操作场景，图层例按需挂载共用角色核心；motion 效果前置，支持接管/暂停/复位与离屏暂停。Reuse 仅保留当前页内存样本，不访问用户磁盘；API 用本地几何 SVG 与有限 WAAPI 时间线说明关系，不运行脚本；官方图与实际 AE 步骤按需展开。墙通过 `adapter.js` 在离屏、隐藏、暂停或 reduced-motion 时显示静态 poster。

## 7. 动效必须解释操作

每个演示按同一契约实现：**初始状态 → 明确输入 → 相关状态变化 → 可观察结果 → 复位/文档入口**。没有操作的区块不假装可操作；无法完成的动作显示来源说明，不放无响应按钮。

- 绑定流程以角色三阶段和用户操作为准，不恢复旧超长 sticky；motion、Tools、Reuse 与 API 可一次入场解释，交互后立即由用户接管。官方参考与操作步骤按需展开，旧截图版宿主结果不覆盖本批。
- 拖拽的主反馈是目标与关联对象的同步变化；列表操作的主反馈是选择范围和显隐；参数操作的主反馈是曲线/画面改变；复制的主反馈是成功或失败提示。
- 不为强调“高级”而让全部面板、角色和标签持续漂浮。场景入场说明只运行一次，用户可接管/重播；显式播放只在当前可见时运行并可暂停。功能墙的循环插画另有统一暂停与静态 poster，不把它当用户正在操作的场景。
- 全页保持亮色，控制器沿用已确认配色；焦点/选择/错误不能只靠颜色区分。
- 键盘提供按钮、列表选择、游标步进和复位；拖拽不是唯一完成方式。减少动态效果时保留可操作的离散状态和结果文字。
- Web 示例边界始终清楚：“网页交互示意；实际操作在 After Effects 中使用 Duik”。官方图注明来自文档而非本次实机；库、工具、API 各写局部限制。

版式按信息职责区分：Hero 保持开放角色舞台；22 槽为铺满动态功能插画与常驻标题/用途；绑定是真实角色三阶段，Tools 是四类操作大舞台，motion 先讲效果；原圆环表达复用，选择/保存/取用工作台进入详情；API 是三调用切换的单几何舞台。官方图、细节步骤与精确控制进入次级展开层；目录/学习已精简为检索与阅读入口，剩余整页组合以 Plan §0 为准。浅色材质与原控制器语义色保留，不把所有区块变成相同漂浮角色卡。

### 首批三个真实交互验收

P1–P3原契约保留下表，不再作为待实现列表。P1部位/关联层与三阶段响应已接入；P2真实26层筛选/显隐在Tools详情，P3裁剪在首层。早期Web示例与2026-11-01折叠版本的测试均属历史；当前绑定和Tools的分批证据统一见Plan §0，**不能用旧通过结果或局部测试代替当前整页宿主验收**。

| 优先项 | 输入与前置状态 | 必须出现的真实结果 | 必须保持的不变量 |
|---|---|---|---|
| P1 绑定因果 | 在绑定区选中一侧手部目标，进行安全范围内拖拽；再用键盘步进同一目标 | 目标坐标、相应骨骼、关联美术层共同更新，选中列表/结构高亮对应同一侧；复位回到起始姿态 | 原图哈希与 26 层不变；骨长/关节连续性沿用现有核心阈值；不影响 Hero 独立实例；不靠整图平移伪造动作 |
| P2 管理结构 | 先调整姿态，再从真实 layerId 对应的图层树选中一处前臂；隐藏该层、筛选列表、重新显示 | 选择有可见高亮；隐藏只作用于对应真实图层；筛选可恢复；重新显示回到之前的姿态与位置 | 层总数、父骨、原坐标不被改写；筛选不擅自复位姿态；骨骼/控制器不是伪造的 PNG 图层记录 |
| P3 工具结果 | 拖动示例蒙版边界，在裁剪前/后间切换并复位 | 子合成边界按示例蒙版范围变化；尺寸标注与实际边界一致；结果是可逆几何状态 | 父合成中参考点位置保持一致（同一布局下误差不超过 1 CSS px）；页面不声称操作了真实 AE 工程 |

时间曲线的单源状态、API片段/复制成功与拒绝等有历史独立测试基线；catalog复制分支使用受控剪贴板替身。动态插画、场景前置与详情主次关系的当前宿主证据和未测边界统一见Plan §0；本表只保留交互契约。任何Web结果都不是“AE执行通过”。

## 8. 历史基线与当前交付范围

以下 E0–E5 仅保留 **2026-11-01 官方截图优先版** 的状态与证据，表内“当前/新版”均指当时，不覆盖 §0 的新场景。

| 历史步骤 | 当时最小交付 | 当时验收问题 | 当时未扩展范围 |
|---|---|---|---|
| E0 保留技术基线 | **已保留**：角色/26 层、亮色、本地路线/发布基线 | 原图哈希/26 层契约与新版 Hero 拖拽/复位通过 | 回滚组件、重做母图 |
| E1 官方面板与内容契约 | **已实现/发布**：23 官方 PNG、认识 Duik、三阶段、八面板/33 入口、六官方预览、Tools 四类 | 来源/哈希与内容审读已核对；新版图片显示与工具导航通过定向宿主检查 | 发明能力/效率数字；把历史文档图称当前 AE 截图 |
| E2 完整绑定因果 | **当时未整体实现**：2026-11-01仅为官方工具/步骤三阶段介绍，原Hero IK保留 | 当时P1关联层高亮/部位选择不由Hero或P2代替；当前已接入绑定舞台，后续证据见Plan §0 | 全身/自由换姿、真实AE自动绑定 |
| E3 工具与复用 | **已实现/发布**：四类官方面板 + 折叠示例，三 motion 官方参考/示例切换，三库图/步骤/放大 | 当前默认态/新入口通过定向宿主检查；旧 tools 7 / motion 5 组仅作历史 | 云库/磁盘管理、AE 面板全功能复刻 |
| E4 API 与学习闭环 | **已实现/发布**：三调用/运行前提 + 编辑器图，五路径/16 入口，11 问/3 组，Footer | guide 10/10；文档进入、复制、学习路径与 FAQ 通过 | 完整命名空间图、完整脚本导出/包兼容保证 |
| E5 新版针对性验收 | **本轮桌面范围通过**：60 项总计、59 通过、1 项可选 browser 跳过；初次 inspect 10 模块且首页无错误 | 新版构建 137/137 页通过，19 组新版桌面宿主检查通过；手机/AE 未验收，文档资源遗留单列 | 用旧 39/15/137 或初次 inspect 宣称整页完成 |

另保留2026-11-02早期整合记录：当时API、学习、开放式目录与精简FAQ/Footer已发布，收尾顺序同步SSR与Vue；91项模块测试通过（另1项可选跳过）、定向7/7与137/137页构建完成，完整31组首轮的30通过/1项分镜计时失败保留，未称全量重跑。这些数字不再称“本批”。当前交付与剩余只见Plan §0；独立候选继续暂停。

允许并行准备/实施已确认板块，但按文件边界：一组做绑定/动画，一组做管理/工具，一组做 API/内容依据；集成负责人独占发布、共享主题、状态契约和页面顺序。未确认的新板块先出具体方案，不并行覆盖整个首页。

完成标准不是“替换了几张图”，也不强制每项能力都制作 Web 仿真。每个主能力域须有清楚的任务结果、适用的交互与可达文档；真实官方界面和 AE 操作解释留作次级证据。AE 未实机验证不能通过网页或官方旧图追认为通过。

覆盖门槛：八面板说明/入口完整，Tools四类不缺项，Automation与Animation分开，三库/笔记/自检不冒充第九顶栏面板，API含初始化/运行态前提。已实现的绑定联动、API/学习与全页组合的证据边界统一记录于Plan §0；不由文档链接、截图或局部测试互相替代，也不把未承诺的扩展功能增补为完成门槛。

## 9. 本地依据索引

下列路径是本次已阅读的能力依据，链接指向仓库文件；站内路由在实施时按相同目录去掉 `index.mdx` / `.mdx`。上游作者/版权/GFDL 保持原文件记录，本方案只归纳能力，不覆盖译文。

| 编号 | 本地文档 | 支撑结论 |
|---|---|---|
| R01 | [`guide/rigging.mdx`](../content/docs/guide/rigging.mdx) | 骨架→美术关联→控制→动画的总体流程 |
| R02 | [`guide/bones/index.mdx`](../content/docs/guide/bones/index.mdx) | 骨骼与美术层分离，绑定复用和底层工具 |
| R03 | [`guide/bones/tools/link-art.mdx`](../content/docs/guide/bones/tools/link-art.mdx) | 名称/距离关联概念；默认行为表述需另核对 |
| R04 | [`guide/controllers/index.mdx`](../content/docs/guide/controllers/index.mdx) | 控制器→约束→骨骼；可定制形状和工具 |
| R05 | [`guide/animation/index.mdx`](../content/docs/guide/animation/index.mdx) | 关键帧、插值、补间、动画库等范围 |
| R06 | [`guide/animation/interpolation.mdx`](../content/docs/guide/animation/interpolation.mdx) | 缓动影响力/速度与关键帧操作，不等同 CSS easing 参数 |
| R07 | [`guide/automation/index.mdx`](../content/docs/guide/automation/index.mdx)、[`looper.mdx`](../content/docs/guide/automation/looper.mdx) | 程序化动画；Looper 是循环外推预设 |
| R08 | [`guide/tools/layers.mdx`](../content/docs/guide/tools/layers.mdx) | 图层创建、命名、组别/侧别/类型标记 |
| R09 | [`controllers/tools/select.mdx`](../content/docs/guide/controllers/tools/select.mdx)、[`show-hide.mdx`](../content/docs/guide/controllers/tools/show-hide.mdx) | 控制器选择与显隐 |
| R10 | [`guide/tools/text/rename.mdx`](../content/docs/guide/tools/text/rename.mdx) | 图层、图钉、项目项批量重命名及可选表达式更新 |
| R11 | [`guide/sanity.mdx`](../content/docs/guide/sanity.mdx)、[`notes.mdx`](../content/docs/guide/notes.mdx) | 自检项目与笔记边界，不是协同项目管理 |
| R12 | [`guide/animation/anim-library.mdx`](../content/docs/guide/animation/anim-library.mdx) | 动画保存、分类、应用；文中带年份的格式/计划不能外推 |
| R13 | [`guide/oco/index.mdx`](../content/docs/guide/oco/index.mdx) | OCO 元绑定和库；网页姿态 JSON 不等于该格式 |
| R14 | [`guide/tools/scripting/library.mdx`](../content/docs/guide/tools/scripting/library.mdx) | 脚本搜索、分类、运行、编辑与收藏 |
| R15 | [`guide/tools/index.mdx`](../content/docs/guide/tools/index.mdx) | 合成、图层、文本、脚本与表达式四类通用工具 |
| R16 | [`composition/crop.mdx`](../content/docs/guide/tools/composition/crop.mdx)、[`settings.mdx`](../content/docs/guide/tools/composition/settings.mdx) | 裁剪并保留父合成位置、批量及嵌套合成设置 |
| R17 | [`guide/tools/text/search-replace.mdx`](../content/docs/guide/tools/text/search-replace.mdx) | 名称、表达式、源文本的查找替换 |
| R18 | [`advanced/api/index.mdx`](../content/docs/advanced/api/index.mdx)、[`getting-started.mdx`](../content/docs/advanced/api/getting-started.mdx) | ExtendScript、初始化、UI/无 UI 运行前提 |
| R19 | [`advanced/api/duik-features.mdx`](../content/docs/advanced/api/duik-features.mdx) | 真实命名空间、`Duik.Rig.arm()` 与 `Duik.Automation.wiggle()` |
| R20 | [`advanced/api/headless-scripts.mdx`](../content/docs/advanced/api/headless-scripts.mdx)、[`shortcuts.mdx`](../content/docs/advanced/api/shortcuts.mdx) | `Duik.Constraint.autoParent()`、无 UI 脚本和 AE 快捷键 |
| R21 | [`guide/cmd.mdx`](../content/docs/guide/cmd.mdx) | AE 内 Command panel，不是操作系统 CLI |
| R22 | [`guide/camera/camera-2d.mdx`](../content/docs/guide/camera/camera-2d.mdx) | 2D 多层摄像机与影响程度、视差；独立于角色 IK |
| R23 | [`getting-started/introduction.mdx`](../content/docs/getting-started/introduction.mdx) | 专业工具集、不锁定工作流、底层工具与 API 定位 |

当前实现依据：`hero-wall-scenes.mjs`、`hero-wall-art.mjs`、`adapter.js`、`scripts/lib/landing-hero-wall.mjs`、`orientation.mjs`、共享 `experience-*`、`tools-*`、`motion-*`、`reuse-demo.*`、`guide-experience.*`、`tool-catalog.mjs`、`preview-scenes.mjs`、`official-media/sources.json` 及三步发布链；逐区事实和资产见 [LANDING_CONTENT_AUDIT.md](./LANDING_CONTENT_AUDIT.md)。`scenes.mjs` 的同角色捕获也用于当前 Reuse；`visual-scenes.mjs` 与旧报告保留历史。旧 19 组/137 页等记录与本批证据严格分开，设计表不充当验收报告。

## 10. 固定官方源引用

以下链接均为同一 SHA 下的官方仓库源文件。first-look L56–L63 是八项分类，L65 为笔记入口，L79 为自检；mkdocs L153–L166 为 Tools 四类与脚本库，L167–L169 为命令行/笔记/自检，L173–L179 为 API 导航。行号按 raw 原文件计算，不使用网页文本提取器重排后的行号。

- [O01：first-look][O01]；[O02：mkdocs 导航][O02]。
- [O03：Automation and Expressions][O03]；[O04：Expression tools][O04]；[O05：Animation][O05]；[O06：Cameras][O06]。
- [O07：General Tools][O07]；[O08：Command][O08]；[O09：Notes][O09]；[O10：Sanity][O10]。
- [O11：OCO][O11]；[O12：Animation Library][O12]；[O13：Script Library][O13]。
- [O14：API][O14]；[O15：API Features][O15]。
- [O16：Layer Manager][O16]；[O17：Crop precompositions][O17]；[O18：Composition settings][O18]；[O19：Rename][O19]；[O20：Search and Replace][O20]；[O21：Wiggle][O21]。

[O01]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/getting-started/first-look.md#L56-L79
[O02]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/mkdocs.yml#L49-L179
[O03]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/automation/index.md
[O04]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/automation/tools/expressions-tools.md
[O05]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/animation/index.md
[O06]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/camera/index.md
[O07]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/index.md
[O08]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/cmd.md
[O09]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/notes.md
[O10]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/sanity.md
[O11]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/oco/index.md
[O12]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/animation/anim-library.md
[O13]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/scripting/library.md
[O14]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/advanced/api/index.md
[O15]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/advanced/api/duik-features.md
[O16]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/layers.md
[O17]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/composition/crop.md
[O18]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/composition/settings.md
[O19]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/text/rename.md
[O20]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/tools/text/search-replace.md
[O21]: https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/guide/automation/wiggle.md
