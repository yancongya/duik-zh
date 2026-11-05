---
关联文档:
  - ../PLAN.md
  - ./GLOSSARY.md
  - ./CHARACTER_RIG_TEST.md
  - ./LANDING_EXPERIENCE_DESIGN.md
  - ./LANDING_CONTENT_AUDIT.md
  - ../README.md
涉及文件:
  - components/home/landing/
  - scripts/publish-duik-landing.mjs
  - scripts/patch-duik-landing-visuals.mjs
  - scripts/publish-duik-experience.mjs
  - scripts/validate-duik-experience.mjs
依赖服务:
  - duik-zh 本地 Next.js 预览服务（127.0.0.1:3017）
---

# Duik 中文站落地页逐板块改造 Plan

当前交付：**2026-11-05 最新四项批注：绑定改为随滚动正放/倒放，三幅插画移回原横向穿梭，目录新增分类宽幅动态图并移除目录官方截图区。下方“一次播放/底部插画/单幅Motion”是历史版本。优化前基线为 `0a5e915`；本轮仍在工作区，未再次提交或推送。亮色、批准角色、可见控制器和原模板父级运镜保留，独立候选页继续暂停。不修改macOS设置；手机、AE和全站离线不在完成声明内。**

根首页基线状态（不是本轮整页或媒体墙验收）：**官方截图优先版已实现并发布：官方界面、AE 操作步骤和文档入口为主，网页示意为辅。该基线合约/单元结果为 60 项总计、59 通过、1 项可选 browser 跳过；初次 inspect 确认 10 个模块且首页无错误。该版构建已通过（137/137 页），19 组桌面宿主检查通过。** 更新日期：2026-11-01。历史基线为 `25dd658`。此前 39 项合约、15 组宿主和 137 页构建只属于上一版，不是本轮验收。改造仅涉及 `/` 及直接依赖；原角色、Nextra 文档、译文和 `upstream/` 保持不变。高级功能、手机与 AE 验证仍单列待办。

关联文档：[`PLAN.md`](../PLAN.md)（项目架构与内容规则）、[`GLOSSARY.md`](./GLOSSARY.md)（术语）、[`CHARACTER_RIG_TEST.md`](./CHARACTER_RIG_TEST.md)（角色来源、组件契约与历史验收）。
体验与能力依据：[LANDING_EXPERIENCE_DESIGN.md](./LANDING_EXPERIENCE_DESIGN.md)；逐区事实、素材与文案审读见 [LANDING_CONTENT_AUDIT.md](./LANDING_CONTENT_AUDIT.md)。2026-11-01 的官方截图优先版已是历史基线；当前使用简短首层和可操作原理场景，真实截图与步骤进入次级，历史测试与当前验收分开记录。
涉及文件：`components/home/landing/`（文案、主题、体验模块、官方素材及固定基线）、三步发布脚本、`public/landing.html` 与 `/duik-experience/`（运行产物）。
依赖服务：duik-zh 的本地 Next.js 服务，预览 `http://127.0.0.1:3017/`；组件和素材从本机同源加载，不接远端镜像。

## 0. 最新决策：已安装 Skills，分期推进原首页整页改造（2026-11-02）

预览仍是 `http://127.0.0.1:3017/`。最新授权是**整页改造**：使用已安装的设计 Skills，将全页收束为“角色绑定 → 动画节奏 → 日常工具 → 资产复用 → 进阶 API / 学习”五段；每段使用简短标题、明确的一句话和真实功能素材，详细步骤与来源留给文档或按需展开。官方八主面板是次级功能导航，不把主叙事排成八篇操作教程。此前“本批只做墙、全页暂不推进”的范围已被替代；独立候选路线仍暂停。

### 当前交付与剩余验收（2026-11-04）

### 文档媒体补齐（2026-11-06，独立于落地页动效验收）

- [x] 恢复稀疏省略的本地文档图片，移除成功占位 rewrite；531 个本地引用已核对真实格式与 HTTP。
- [x] 两张 Wikimedia 旧缩略图仅在渲染层迁移同素材地址；视频失效时提供官方课程入口、来源及重试，不覆盖译文。
- [ ] 53 个官方旧视频原地址本次均为 404，站内播放没有恢复；后续仅在官方提供可公开使用的新源时更新。

本轮构建、媒体测试与浏览器证据单列于 [文档媒体交付](DOCS_MEDIA_DELIVERY.md)，不复用旧落地页验收结论。

### 正式 Logo、加载与压缩（2026-11-05 最新授权）

**2026-11-06 入场增量优先于下方420 ms历史版：** 已改为1800 ms Logo入场→820 ms推镜虚化消散，与Hero五组900 ms、70 ms错峰清晰入场重叠。保持原角色、布局及滚动父级，实际输入/后台/reduced在退场和错峰阶段仍立即取消；结束释放动画属性。定向45/45通过，本次构建137/137通过；真实浏览器记录五组实际delay和中间帧，详见[品牌验收](BRAND_PERFORMANCE_ACCEPTANCE.md)。

- [x] 已选 A 统一生成 51 个 SVG/PNG/ICO，双色/单色/反白、16～1024 px、普通/Apple/PWA 用途分开；`/brand.html` 为正式规范页。
- [x] 首页 SSR、Nuxt head、Nextra metadata 与导航同源接入；旧四案从公开目录移出并归档，旧路由跳转规范页。
- [x] 首屏按最新反馈保留 1800 ms 完整进场＋420 ms 柔和淡出，缓存命中也不直接跳 Hero；背后正常加载，较慢时循环等待，超时/失败/输入/后台/深链接/reduced 不阻挡；SSR/Vue 同尺寸外壳修复挂载位移。
- [x] 57 张网页交付图经过完整 RGBA 核对，3,900,447 → 2,628,660 字节，节约 1,271,787 字节（32.6%）；原图、26 层与 rig 参数不修改。
- [x] 本轮定向 51/51 通过；开发服务浏览器采样无失败图/脚本错误，CLS 约 0.0003。此数值不是线上或生产构建验收。
- [x] 最终生产构建 137/137、定向 51/51、57 个压缩图路由均通过；桌面连续帧确认 ready 后仍完整进场并柔和淡出，最终桌面 CLS 约 0.00046。手机视口覆盖未生效、系统 reduced 未实测，完整边界见 [品牌与性能验收](BRAND_PERFORMANCE_ACCEPTANCE.md)。

### 独立 Logo 方向试稿（2026-11-05 历史阶段）

- [x] `/logo-lab.html` 提供四版：回环沙漏、分段关节、D形时间、DU/IK字标；来源原图与固定版本归属保留，正式首页及标志不替换。
- [x] 最新反馈要求各自进场后自动循环，已输出16个原生SVG（静态/进场加循环/仅循环/单色），小尺寸样张保持静态；离屏/后台/reduced停止，恢复仅循环，点击重看进场。
- [x] 用户已选 A 并提出异色/撞色，保留原几何与动效，试用朱红回环/青绿沙漏；16/24/32px和单色同步。
- [x] 后续用户已授权正式接入，见上方最新增量；本项不再阻止替换导航或 favicon。

真源与动效协议见[Logo试稿](./LOGO_STUDIES.md)。本批9/9定向测试、16个SVG审查、137/137页构建通过，3017已恢复；当前桌面试色板独立复核`ship`。系统偏好/手机/正式品牌不外推，不引用前批落地页验收。

### 滚动绑定、横向三场景与分类横幅（2026-11-05，最新四项批注）

- [x] 绑定用sticky舞台和真实章节几何映射26层及相机；向下归位、向上倒序，没有计时推进。终态开放控制器，往返保存拖拽姿态；保留加载/运行错误及重试。
- [x] 三幅原动态插画移回原横向轨道，每卡一幅宽画幅、短标题、用途及文档入口。原父级真实测量、曲线J+se与圆环不变；移除底部重复gallery，`#more-features`兼容锚点随第一场景迁移。
- [x] 分类上方新增4:1原创SVG横幅，八主面板及全部共九态；分类、搜索和文档结果即时同步，仅图形循环。移除目录官方面板截图UI，不删公共素材或文档入口。
- [x] 完整发布同步SSR/Vue、本地模块。定向272项：271通过、1可选浏览器跳过。当前1331×1086桌面实测绑定正反滚动/停滚保持/保存姿态，横向插画可见循环、目录九态与键盘切换；目录截图节点为0。
- [x] 最终`npm run build`退出0、137/137页，结束后恢复3017。保留原多lockfile根目录推断警告，不扩展修改其他项目。

本轮记录：[四项批注验收](../output/scroll-chapters-acceptance-2026-11-05.md)。深滚圆环截图期间有位置跳变，不计为稳定运镜验收；系统偏好、手机和AE保持未实测。没有将历史截图或旧测试当作本轮结论。

使用Impeccable与animate约束局部构图和运动，web-clone工作流约束真源、SSR/Vue同源发布及原父级运镜。系统级减少动态效果按用户要求不实测，不将代码媒体事件回归写成系统验收。无commit/push/deploy。

### Hero 居中与条带扩宽（2026-11-05，本批局部精修）

- [x] 仅修改首屏两处：顶部spacer与底部区域等权分配剩余空间；条带侧列按链接内容收缩，中间解除模板最大宽度。角色资产、姿态、原循环与滚动动画不改。
- [x] 从Hero真实组件中移除“复位/隐藏控制器”及事件；保留12个控制器、加载/运行错误回退与重试。重试成功焦点返回新控件，shadow host不设负tabindex，保留内部Tab顺序。
- [x] `landing:publish`同步；hero-lifecycle / hero-ribbon / hero-marquee共17/17通过。旧浏览器驱动改为检查按钮缺席与控制器常驻，不再点击已移除按钮。
- [x] 当前1331×1086、80%缩放桌面：首屏角色区域y=301.64～749.61，居于画面中部；条带窗口539→1003.67px。实际手部拖拽使SVG端点从(1050,655)到(1129.53,586.34)，前后scrollY=97.5；方向键与Tab从右手进入左手可用。
- [x] 滚至scrollY=1455时原Hero透明度为0且条带inert；返回0后透明度1、解除inert。控制台本轮无warn/error；[最终首屏截图](../output/hero-centered-ribbon-2026-11-05.png)捕获前后scrollY均为0。
- [x] 本轮`npm run build`退出0，137/137页生成；恢复3017。adapter/theme真源与发布副本逐字节一致，定向diff无空白错误（日志：`output/build-hero-polish-2026-11-05.log`）。

沿用Impeccable局部polish与web-clone真源发布规则；不外推移动端、其他章节或系统级减少动态效果验收。不commit/push/deploy。

### 绑定精简与曲线、功能插画恢复（2026-11-05，最新增量）

- [x] 绑定首层仅保留标题、26层自动入场映射、最终可拖拽控制器和简短归属/文档链接。删除阶段/部位栏、右侧说明、关联层/面板详情及复位栏；不改角色、镜头完成信号或姿态交接。
- [x] 终态同步组件 `interaction="drag"` 与核心配置，修复“控制器显示但宿主仍禁止输入”。实际方向键与鼠标拖拽均改变手部位置，操作前后 scrollY=5450 不变。
- [x] 横向背景保留原曲线与描边动画，仅将 SVG 投影从 J 延伸到 J+se，覆盖圆环接近间距；原父级测量、滚动距离和时间线不改。当前桌面曲线宽度约2211→3257px，取得有效中途画面。
- [x] 圆环后、目录前新增 `#more-features`：复用悬挂装置、纸飞机与分层风景，配短标题/用途/真实文档链接。compact模式删除播放器、参数和截图详情，继续使用原场景模型与90%可见自动循环；独立工作台不受影响。
- [x] `landing:publish` 已同步SSR/Vue及本地模块；workflow/motion/cinematic/closing定向回归159/159通过，无跳过。真实浏览器观察上排双场景循环、下排摄像机进入后循环、上排离屏停止。
- [x] 独立只读设计/源码复核：本轮桌面增量 `ship`，无阻塞修复项。未外推移动端或系统偏好验收。
- [x] 最终 `npm run build` 退出0，137/137页生成；仅保留已有多lockfile根目录推断警告，未扩展修改上层工程。构建日志 `output/build-restoration-2026-11-05.log`，恢复本仓库3017开发服务。

本批沿用Impeccable的精简/保留原则、Taste的低文本密度和animate的解释性动态，恢复既有插画而不生成新角色或重写原时钟。有效图片、浏览器输入记录、截图工具的滚动跳变与未测边界见 [本次恢复验收](../output/restoration-acceptance-2026-11-05.md)。无commit/push/deploy。

### 核心章节与收尾精简（2026-11-05，前批完成）

- [x] 基线提交 `0a5e915`；未推送。已通过 SkillDo 记录和实际 symlink 核实 Impeccable / Taste / animate / web-clone-workflow；本批不重复安装或重选视觉风格。
- [x] 保留 Hero 与 22 槽墙；绑定、工程整理、动作表现、资产复用各用一个主要动态场景。工程整理位于动作之前，让原 Motion → 圆环父级轨道保持连续，不拆散模板运镜。
- [x] 绑定保留 26 层展开→关联→接管的一次性镜头，压缩重复介绍、阶段说明及工具栏；真实图层与面板留在详情。
- [x] 工具区改为单幅可直接操控的动态排版作品；命名/标签贴近所选对象，不再左右各一块简单比较面板。
- [x] 三张 Motion 说明卡合成一个纸飞机场景，连贯展示节奏→自动化→镜头深度；原父级通过实际尺寸重测，圆环保持进入、选择与离场。
- [x] 收尾仅保留工具/学习/API 索引与开始使用/FAQ 两区；API 舞台进入默认关闭详情，文档目标、八主面板、学习路径和归属不删。
- [x] 发布、针对性回归、实际桌面交互/转场验收及 `npm run build`；结束恢复 3017。
- [x] AGENTS / README / 本 Plan 已同步最终证据，本轮 Goal 的交付条件完成；不自动提交本轮后续改造，不 push/deploy。

本批 Skills 的实际作用：Impeccable distill 用于删减重复首层；Taste 用于同一作品的大画幅与文字层级；animate 用于可见循环、直接操控和离屏释放；web-clone-workflow 用于保留真实运行入口及原父子滚动契约。

本轮证据（不沿用历史验收）：全套 534 项，533 通过、1 可选浏览器跳过；标题语义修正后相关 39 项通过；独立设计复核指出的 Motion 90% 可见门槛已统一到 IO/画幅/RAF/resize/BFCache，专项 20 项通过。最终构建 137/137 页成功，3017 恢复且根页/模块 HTTP 200；独立复核对唯一修复项判定 resolved / ship。当前桌面实际采样 27 次横跨三个镜头，自动循环、六景层变换与 scrollY 固定均有记录；修复后实际 85.08% 可见时停止，完整画幅恢复循环。1500×1086、1280×800 图片和实际拖拽/键盘/文档跳转有定向证据；不将本次修复项复核扩写为全平台批准。详见 [本轮验收](../output/cinematic-acceptance-2026-11-05.md)。

### 去除播放进度界面（2026-11-04，前批）

- Tools整理进度、Motion时间/运镜进度、API进度与阶段跳转从源码删除，不是CSS隐藏。API切换示例即自动演示；参数和文档留在原位置或按需详情。
- 被动hover/focus不再暂停；真实拖拽/按键操作与展开详情优先，离屏/后台/reduced内部停止。复用分镜改为三个按钮，保留待选/已存/已取用及`{id,frame}`快照。
- 绑定保留上一批的一次性连续演示与终态接管；原墙、圆环滚动运镜、批准角色及亮色保持。
- [x] 发布完成；457项测试中456通过/1可选跳过/0失败，构建退出0、137/137页，恢复本仓库3017，HTTP200。8个本轮模块/样式与发布副本逐字节一致。
- [x] 当前桌面实际确认全页无播放滑杆；Tools、插值、自动化、摄像机、API均完整自动往返，普通hover/focus不停止。摄像机真实拖动释放后恢复，复用3分镜按钮保存/取用与自动循环保持快照。
- 本批证据：[无播放进度界面验收](../output/no-scrub-acceptance-2026-11-04.md)。不改系统偏好，不外推手机/AE/全站离线；绑定一次性行为本轮未改。下方历史记录不是本轮证据。

### 前批：绑定一次性连续演示与图层管理主展示（2026-11-04）

- [x] 绑定首次65%可见且26层解码就绪后自动展开→关联→控制；实际镜头完成即推进，不再有1800/3000ms固定停留。末镜头完成才开放拖拽，返回页面/离开鼠标/释放焦点不重播。
- [x] 已开始演示被用户或离屏/后台打断时交还控制；手动阶段与详情不被自动逻辑替换，reduced直达终态。保留pose，修复同尺寸resize吞镜头、旧decode成功覆盖错误态的生命周期缺口。
- [x] Tools默认“图层再多，也能各就各位。”；SSR与客户端同为图层管理，裁剪降为最后一项。原几何舞台与名称/组别/侧别/美术类型映射保留，无需点击自动整理。
- [x] 其他Tools/Motion/API/复用/墙/条带保持可见自动循环，无播放器按钮；检索、FAQ、学习与原滚动圆环保持原行为。
- [x] 最终发布成功；`landing:test`443项总计，442通过、1可选浏览器跳过、0失败；构建退出0、137/137页，结束恢复3017，根页HTTP200。绑定74项和驱动15项、Tools局部39项均包含在相关总数内，不重复相加。
- [x] 当前1500×1086 CSS视口、80%缩放下真实采样首次展开→关联→接管→complete，无固定停留；完成后实际拖拽，离开到工具区再返回仍为complete且手部transform完全相同。Tools默认layers，进度0↔100、名称整理↔恢复持续自动循环；全页DOM无播放/暂停/重播按钮。
- 本轮记录：[一次性绑定与图层管理验收](../output/workflow-once-acceptance-2026-11-04.md)。其余循环模块没有重新完整浏览器走查；未改系统辅助功能，未声称手机/AE/全站离线验证。代码完成后仅更新文档，无commit/push/deploy。

### 前批：自动循环与背景衔接（2026-11-04）

以下保留前批全循环实现与验收；绑定部分已被上方一次性演示替代，其余自动循环与背景修复继续有效。不重建已确认角色或原滚动轨道。

- [x] 介绍/绑定/状态条移除独立不透明背景，直接延续墙后的全页动态亮色色场。
- [x] 墙与Hero条带移除播放暂停按钮，保留原循环、退场和本地图标/文档；条带右侧改为“查找工具”。
- [x] 绑定准备解码后、画布65%可见自动循环：展开→关联→接管→下一轮；前两步最低1800ms、末步最低3000ms，均等待实际动画完成。逐镜头代次阻止跨轮旧回调，改姿通过renderer连续交接而不写掉pose。
- [x] Tools/Motion/API沿用各自原时间线往返循环，无播放器按钮；复用工作台自动演示，但用户保存/取用快照不被后续循环覆盖。检索/学习/FAQ阅读不自动轮换。
- [x] 保留直接控制器、阶段、参数、复位、详情；拖拽/键盘/详情优先，离屏、后台和reduced内部停止；自动循环不反复播报aria-live。
- [x] 最终 `landing:publish` 成功；`landing:test` 总计435项，434通过、1项可选浏览器跳过、0失败；`npm run build` 退出0、137/137页。构建时停止同仓库dev，结束后恢复3017，根页HTTP200；工作流真源与发布副本一致。
- [x] 当前桌面实测绑定连续多轮、真实手部拖拽与保存姿态交接、离屏停止/返回恢复；Tools/API往返和摄像机Motion自动循环可见。墙→介绍→绑定取得当前背景衔接截图，页面DOM无播放/暂停/重播按钮。仅定向验收，不复用历史33点作为本次证据；墙/条带/复用完整交互与其余两张Motion未在本批全部重测。
- 本批日志、采样、截图与边界见 [自动循环验收记录](../output/autoloop-acceptance-2026-11-04.md)。收尾只更新文档，不重复已完成构建。
- 系统级减少动态效果切换仍按用户决定不实测，不修改macOS设置；无commit/push/deploy。

### 前批桌面整合验收快照

下表及后续记录保留此前批次的实现和证据；其中播放/暂停/有限演示已由上方自动循环决定替代，不是当前交互要求。历史“待重做/未取得截图/goal active”只代表当批状态，不授权重建已完成场景。前批记录见 [桌面整合验收](../output/landing-final-acceptance-2026-11-04.md)。

| 范围 | 前批已有实现 | 当时范围与边界 |
| --- | --- | --- |
| 导航、Hero与底部横条 | 亮色首帧、原渐变、批准角色、八主面板横向循环/暂停/原退场 | 不重做；后续修改仅做关联回归 |
| 22槽墙、绑定、Tools与Motion | 墙体暂停/拖拽/文档跳转、绑定完整重播与改姿保持已实测；稳定画幅及本批单向跨区走查覆盖墙→绑定→Tools→三类Motion | 完成约定桌面范围；走查是截图序列，不是逐帧录像或本批全控件重测 |
| 圆环与复用 | 本批自然滚动覆盖大图环绕、左侧汇聚/右侧说明、轮选与旋转离场；二级复用及reduce逻辑保留 | 按用户决定，系统级减少动态效果切换保留未实测，不修改macOS设置 |
| API、目录/学习、FAQ与Footer | API三示例首层单调用及真实播放/暂停/完成已测；本批跨区走查到实际Footer底部，完成审计未发现新增内容缺口 | 桌面首尾衔接已闭合；不将截图序列外推全部中间帧 |
| 文档 | 亮色默认、中文导航、双前缀重定向；本批真实完成页脚→安装文档→根首页 | 不改译文；不把局部路由证明外推全站离线 |

### 最新收尾：整页桌面走查与模板残留清理（2026-11-04）

- 应用已安装设计Skills进行最后语义/内容审计，保留现有完整舞台、原运镜和角色。只修两个已确认的源代码残留：head内旧站验证meta/计费监听，以及圆环三张装饰图的旧`testimonial`替代文字；不重设模块。
- head清理按parse5节点源码区间处理，其余字节不变；圆环SSR/Vue共用空alt，五项功能语义、14图索引及原进度均不变。发布产物两条回归先失败0/2、修复后通过；独立审查未发现确定问题。
- `landing:publish`成功；本批关联回归**52/52、0跳过**，最终`npm run build`**退出0、137/137页**。日志分别为`output/landing-final-cleanup-publish-2026-11-04.log`、`output/landing-final-cleanup-tests-2026-11-04.log`、`output/build-landing-final-cleanup-2026-11-04.log`。构建后恢复本仓库3017服务，根页HTTP200；代码完成后仅更新文档，不重复已完成构建。
- 当前1600×900、80%页面缩放保持不变，单向自然滚动`0→22191.25`，33个截图检查点覆盖Hero/条带→墙→初识/绑定→Tools→插值/自动化/摄像机→圆环环绕/汇聚/轮选/离场→API→目录/学习→FAQ→Footer。逐图可见，没有观察到整段空场/缺块，所有点均无横向溢出。原生平滑滚动期间部分截图前后位置相差1–30px，如实记录，不冒充固定帧或逐帧视频。
- 真实点击页脚“安装并开始使用”到`/docs/getting-started/install`，中文标题、目录与浅色阅读器可见；点击“返回首页”回到`/`，Hero角色/控制器与底部条带正常。最终error日志为空，旧head节点为0；不外推完整网络或全站离线通过。
- 报告及全部33图索引：[整页桌面整合验收](../output/landing-final-acceptance-2026-11-04.md)。本批没有重测全部控件；墙/绑定/API真实输入沿用前批最终版本的独立记录。README、AGENTS、内容审计与体验方案已同步；无commit/push/deploy。
- 整页实现与本轮桌面整合要求已闭合。用户明确拒绝修改系统设置，系统级减少动态效果切换作为接受的未测边界保留；手机、AE及完整文档离线不声称通过，不因此反复重建已完成场景。

### 前批结果：绑定可见性修复与校准浏览器验收（2026-11-04）

- 用户明确选择“不修改系统设置，保留为未实测”。不切换macOS辅助功能，不再次要求授权；媒体事件替身回归与真实系统偏好切换分开记录。沿用已安装设计Skills的中断/生命周期边界，本批不重生角色、不改舞台造型和镜头时长。
- 浏览器返回文档后曾出现ready/artReady均true、画布完整可见而播放禁用，滚出再回恢复。实际根因未直接定位为bfcache；真实`mountWorkflow`受控复现两条代码缺口：同批`false→true`只读首条，以及旧挂载已disconnect的通知仍写新舞台。两条回归先0/2，修复后通过；独立复核又复现播放中`false→true`吞掉离屏中断，新增第三条先0/1再通过。当前取最后匹配画布项决定按钮，同时保留批次内离屏取消；回调与`syncPlay`均拒绝disposed写入。
- 最终发布见`output/workflow-visibility-final-publish-2026-11-04.log`；workflow61、landing19、API14合计**94/94，0跳过**，见`output/workflow-visibility-final-tests-2026-11-04.log`。独立只读复核无已确认遗漏。真源/发布`orientation.mjs`摘要一致：`33476a3ac29d325071ecbda9a58420555981c590a901844b5a3cebe18ac2a73a`。
- 图片墙实际暂停后22张本地poster均complete且800×800，恢复后8张可见封面播放；22组常驻标题/用途保留。真实拖动控制器卡片移动132×46px，未滚动、未导航；普通点击打开`/docs/guide/controllers`，中文标题/侧栏与亮色存在。显式`img.decode()`未由当前浏览器只读接口暴露，因此不把complete检查写为decode Promise实测；文档稀疏媒体占位也不算全站离线通过。
- 最终绑定版本已实测中立姿态完整播放、真实手部拖拽、播放中滚出停止和滚回仅恢复按钮。修改姿态后的完整重播采样85次，覆盖`layers→link→control→complete`；`scrollY=4693.75`不变，手部控制器的文档坐标前后相同，角色姿态保留。稳定图见`output/workflow-tour-final-complete-2026-11-04.jpg`与`output/workflow-final-saved-pose-2026-11-04.jpg`；不是仅以静态poster证明绑定正常。
- 当前页面缩放80%、DPR约0.8；裁剪坐标与尺寸按DPR校准后可取得非首屏画面。Tools、摄像机、圆环进入/汇聚、API、目录/学习、FAQ与页脚均取得分段画面。原环绕图到左侧圆环/右侧说明确实可见，见`output/camera-orbit-entry-final-2026-11-04.jpg`、`output/orbit-collected-final-2026-11-04.jpg`。但插值/自动化及一次FAQ捕获前后scrollY有变化，混入错误区域的图片仅作诊断；不据文件名或“截图成功”冒充稳定完整回放，不添加推测性布局补丁。
- 收尾仅补上述两张Motion画幅：`output/interpolation-stable-final-2026-11-04.jpg`前后均7571.25，`output/automation-stable-frame-final-2026-11-04.jpg`前后均9090，完整画幅可见；FAQ和Footer也分别取得稳定图。没有重新跑全套测试、修改系统偏好或调整布局；这些仍是分段画面，不是整页逐帧录制。
- API三示例真实点击后，各自正确的输入/调用/结果及唯一场景同步；关闭详情时调用只出现一次。播放至0.111、暂停在0.115、继续至1.000并停止，原位点击期间`scrollY=18531.25`不变。手动调用阶段为0.480，但该次定位器自动滚动至18918.75，单独记录，不能宣称此操作无滚动。源码/设计说明同步为4200ms；旧2400ms报告8/8及历史学习6/6不再称“最新”。
- 停止已核实的同仓库dev后，最终`npm run build`**退出0、137/137页**，见`output/build-workflow-visibility-final-2026-11-04.log`；随后恢复3017，日志`output/dev-workflow-visibility-final-2026-11-04.log`。本轮浏览器error列表为空。详细范围见`output/workflow-visibility-browser-2026-11-04.json`；README/AGENTS/体验方案同步，无commit/push/deploy。当批goal仍保留连续验收范围；此项已由上方最新33点自然滚动走查收尾。

### 前批结果：图片墙观察器交接与API首层去重（2026-11-04）

- 本轮沿用Impeccable harden的中断/陈旧回调规则、Taste的首层去重要求，以及Emil animate“不为阅读/频繁操作增加动画”的限制。保留当前场景、亮色、批准角色、原墙几何/拖拽和API的4200ms镜头，不重新设计已经完成的模块。
- 独立事实/资源审读核对了八主面板、Tools四类、33精选入口、五学习任务/16条路线及11问默认四问；54个独立文档目标有本地MDX。23张官方PNG的尺寸/字节/哈希、12个官方SVG、22张原创SVG及22张poster与清单/发布副本一致。此为本地内容与字节证据，不外推浏览器解码、实际AE或全站离线验收。
- 图片墙旧回归只检查源代码是否含有`hidden`/`disconnect`。改为执行真实`mountWallMotion`后，首次16项中14通过、2失败：水合移除图片的旧IO通知会重新显示离墙按钮，最终pagehide后的旧通知仍写播放状态。现按picture和实际img登记，拒绝已断开/离开当前墙/被替换的target；最终退出后IO、Mutation及sync全部失效。新增同picture换img与退出后排队mutation回归，专项18/18；用户暂停、后台/reduce往返、persisted页面返回保持原选择。
- API舞台原关系行之外的status仍重复完整调用代码，旧测试甚至要求这份重复。现status只说明阶段/能力结果，调用代码只在关系行出现一次，关闭详情仍可复制。回归统计详情外的真实文本，覆盖SSR、三示例×三阶段与减少动态效果，专项14/14。未删除示例、文档入口、播放/暂停/复位、进度或官方运行前提；独立复核确认修正边界。
- `landing:publish`成功，见`output/wall-api-publish-2026-11-04.log`；整合图片墙、API、Hero生命周期与发布一致性定向回归60/60，无跳过，见`output/wall-api-tests-2026-11-04.log`。这不是全套或浏览器验收。
- 本轮浏览器控制连接先无法操作已保留标签，重置后重新绑定/新建同一IAB预览仍超时；没有取得新的墙体/下半页真实输入或画面证据，未绕开工具限制使用外部浏览器/CDP，也未因其失败改布局。用户此前“各板块可见”的反馈仅解除“页面空白”怀疑；上表的墙体组合、连续视觉与实际系统偏好切换仍待，整体goal保持active。
- 本批构建前停止已核实的同仓库3017 dev，`npm run build`退出0、137/137页，见`output/build-wall-api-2026-11-04.log`；原多lockfile提示保留。随后恢复3017，根路由HTTP 200，见`output/dev-wall-api-2026-11-04.log`。发布HTML复核22组标题/用途、API详情外调用字串恰好一次；adapter/API真源和发布副本逐字节一致，摘要与边界见`output/wall-api-integrity-2026-11-04.json`。README/AGENTS同步，未commit/push/deploy。

### 前批结果：绑定镜头完成与暂停交接（2026-11-04）

- 修复确定的时序缺陷：原固定1800ms推进可能在图层WAAPI完成回调延后时截断500ms已保存姿态恢复。`createWorkflowCinema`现汇合相机、全部26层及姿态恢复的完成信号；`createWorkflowTour`同时等待原最低停留和实际完成，不改变既有动画时长、造型或镜头设计。接管仍立即可操作，最终镜头完成后才标记`complete`。
- 独立复核发现并修正旧定时回调先清空新timer句柄的问题：先核验当前镜头代次，再清理句柄。暂停、重播、手动输入、离屏、后台、减少动态效果与卸载会解除旧等待；延迟WAAPI/相机、无WAAPI及中断专项覆盖实际回调顺序。`node --test scripts/test-duik-workflow.mjs scripts/test-duik-landing.mjs`最终77/77（绑定专项58/58），见`output/workflow-settlement-final-tests-2026-11-04.log`；独立复核未发现本批其他确定阻塞。
- 真实浏览器完整播放采样：拖动手部并键盘微调头部后，26层归位、约500ms恢复已保存姿态、再进入接管，最终镜头结束才完成；496次DOM/动画状态采样中`scrollY=4775`不变。该完整播放采样在最后timer清理守卫补丁之前；不把它标为最终版逐像素连续画面验收。
- 最终构建版另行实测：恢复途中点击暂停，保存姿态立即恢复、`inert=false`、贴图层可见，后续仍保持暂停。选择接管后真实拖动左手，控制器位置改变且`scrollY=4993.75`前后不变，26层均已解码，error日志为空。两种版本的证据分开保存在`output/workflow-settlement-browser-2026-11-04.json`。用户确认各板块可见，深滚截图纯底色仍只记为捕获限制，不添加推测性布局修补。
- 已批准角色保持26层、像素精确复核通过，母图SHA-256仍为`fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a`；未修改共享绑定核心。真源与最终发布`orientation.mjs`的SHA-256均为`5924bb9df3707cfbad3280dac4d689d6b5dd7a66c7ffe8878e785aeb65c931e0`。
- `landing:publish`成功，见`output/workflow-settlement-final-publish-2026-11-04.log`。停止已核实的同仓库dev后构建退出0、137/137页，见`output/build-workflow-settlement-2026-11-04.log`；随后恢复3017，根路由HTTP 200，日志`output/dev-workflow-settlement-2026-11-04.log`。README/AGENTS已同步，无commit/push/deploy；整页goal保持active，上表连续视觉、墙体组合及系统偏好实测边界不变。

### 前批结果：横向轨道键盘交接（2026-11-04）

- 用户明确回复“能正常看到各板块”。此前下滚截图空白是捕获证据限制，不能据此认定页面缺块或追加猜测性布局CSS；也不能将这句反馈扩展为完整交互/视觉验收。
- 真实桌面Tab复现：第一张Motion文档链接进入第二张舞台后，焦点仍在`x=1720..2596`屏外（视口1600×900），祖先`scrollLeft=0`。新增`capability-keyboard.mjs`仅观察真实Tab意图，从当前原GSAP平移tween反算即时物理滚动，保持原Tab顺序、文案、场景和所有测量/运镜公式。
- 首次浏览器回测暴露了测试接缝遗漏：window上的捕获blur包含普通元素失焦，误清Tab意图。现只响应窗口自身blur，回归补齐keydown→旧元素blur→focusin→keyup。三张卡片双向切换的焦点位置已实测进入视口；没有把首轮单元通过当作交互修复完成。
- 原父级在resize/media事件开始挂起交接，两次Vue提交与refresh完成后再恢复，解除/卸载作废陈旧请求；圆环出口单独消费原父阶段及现有选中项，不套第四张卡片公式。窗口blur、原生事件顺序、宽卡片、锁、重测与卸载专项20/20；主代理发布后合并原Motion、父重测/选择/链接回归108/108，含真源/发布产物一致性，见`output/motion-keyboard-tests-2026-11-04.log`。不是整套重跑。
- 原生Tab/Shift+Tab实测：第二/第三舞台进入视口，卡片内继续Tab不移动轨道；摄像机→圆环文档和反向返回均可见，原位鼠标点击摄像机前后`scrollY=10642.5`不变，祖先`scrollLeft`全为0。错误日志为空，证据`output/motion-keyboard-browser-2026-11-04.json`。未导航文档、未实际切换系统reduce偏好；深滚截图仍不可靠，不据本次焦点几何宣称完整连续视觉通过。
- 三步发布见`output/motion-keyboard-publish-2026-11-04.log`；构建前停止已核实的同仓库dev，`npm run build`退出0、137/137页，日志`output/build-motion-keyboard-2026-11-04.log`，原多lockfile提示保留。随后恢复3017（`output/dev-motion-keyboard-2026-11-04.log`）；README/AGENTS已同步，无commit/push/deploy。独立只读复核未发现本批确定阻塞，整体goal仍保留表中的视觉待验收范围。

### 前批结果：圆环当前项交接与验收边界（2026-11-03）

- 本轮独立全页审读未发现新的叙事缺口；剩余是当前墙体组合、26层重组连续交接、系统偏好切换和下半页连续衔接的视觉证据，不重新设计已经完成的模块。Hero底部八主面板横条保持原横向循环、暂停和随父级滚动退场。
- 真实wrapper与原子组件表达式执行复现：普通`.7/脚本库`进入reduce时变成`.5/OCO`，同时错误切换文档。`orbit-vue.mjs`现在只在进入手动模式时继承当前项，匹配原15°提前选中偏置；重复事件保留用户手动项，退出回到父级物理进度，不强制滚动。五项Enter/Space、对应文档与卸载清理有专门回归，已加入`landing:test`。
- 新回归先红后绿：第一条旧实现为0通过/1失败（保留于工具记录），新实现16/16；三步发布后主代理复核偏好、图标、选择、链接、父级resize与发布契约共93/93，见`output/orbit-preference-handoff-tests-2026-11-03.log`。使用真实代码表达式和媒体事件替身，不是操作系统偏好或GPU视觉证明。
- 截图限制仍复现：恢复浏览器默认viewport后，标准截图和零坐标clip均返回纯底色；前后`scrollY=4547.5/workflowTop=84.3359375`不变。页面仍能读取绑定舞台与控制器结构，不能据空白截图直接认定页面缺块，亦不能宣称连续视觉验收通过。2026-11-04用户已确认实际右侧预览各板块正常可见，不添加猜测性CSS。
- 三步发布完成，真源与`public/duik-experience/orbit-vue.mjs`逐字一致，日志`output/orbit-preference-handoff-publish-2026-11-03.log`。`npm run build`退出0、137/137页，见`output/build-orbit-preference-handoff-2026-11-03.log`；构建前停止已核实的同仓库dev，结束恢复3017，根页HTTP200，日志`output/dev-orbit-preference-handoff-2026-11-03.log`。保留原多lockfile提示；无commit/push/deploy。
- 构建后重新加载根页，角色控制器可见、横条为`playing/inert=false`，8个模块入口加1个总览入口，当前error日志为空。截图`output/hero-ribbon-orbit-handoff-2026-11-03.jpg`前后`scrollY=0`，只证明当前首屏。整页连续画面捕获在连续三轮仍无法可靠完成；源码/本地构建工作已收尾，后续需恢复可用的可视验证或用户提供实际预览反馈，不能以反复重建已完成模块代替验收。

### 前批结果：圆环父级偏好生命周期（2026-11-03）

- 本轮保留Hero八面板横条及已完成模块。独立当前源码审读未发现需要重构的新叙事、旧业务或22槽功能语义缺口；原模块名不是业务残留，不以陈旧待办追加简单面板。
- 确认CSS纵向静态布局和子组件手动选择未停用父级GSAP，也未触发偏好恢复后的闭包重测。`landing-capability-resize.mjs`升级v3：在原测量函数外控制reduce释放/清spacer，初始及偏好恢复共用测量队列，保留完整原函数、物理滚动位置及所有正常运镜公式。
- `test-duik-capability-resize.mjs`以真实本地GSAP、模拟几何/原生media事件覆盖：旧v2为23通过/9失败，新v3独立复核35/35通过；补充真实v1/v2升级与失败关闭锚点。负控见`output/capability-reduced-before-2026-11-03.log`。此证据不是操作系统减少动态效果的浏览器实测。
- 捕获边界本轮得到具体证据：API截图clip前scrollY为18137.5，返回后8623.75；默认截图前后19572.5保持，但画面是纯底色。保存的`output/continuity-api-2026-11-03.jpg`仅证明单个API画面，不证明连续滚动衔接。未据此猜测性改布局，完整衔接仍待；后续截图必须记录捕获前后位置。
- 本批三步发布成功：`output/capability-reduced-publish-2026-11-03.log`；定向集成65/65通过（父级偏好/尺寸、选择/链接、圆环图标、Hero条带），含实际public模块逐字一致检查，见`output/capability-reduced-tests-2026-11-03.log`。`npm run build`退出码0、137/137页，日志`output/build-capability-reduced-2026-11-03.log`。构建前停止已核实的同仓库dev，结束恢复3017，根页HTTP200，日志`output/dev-capability-reduced-2026-11-03.log`；`git diff --check`通过，保留多lockfile提示。
- 构建后根页真实点击横条暂停得到`aria-pressed=true/state=paused`，键盘恢复后`aria-pressed=false`；下滚到2630时原父级`opacity=0/pointer-events=none`且条带暂停，Home返回后`scrollY=0/opacity=1/state=playing/inert=false`。8个可Tab入口、2份实际测量轨道、角色/控制器同屏；最终画面`output/hero-ribbon-final-check-2026-11-03.jpg`，该新页error日志为空。保留根页预览标签，不重测已覆盖的所有文档导航；系统偏好切换及整页连续视觉仍未宣称通过。整体goal保持active，无commit/push/远端deploy。

### 前批结果：Hero画布稳定性与横条复核（2026-11-03）

- 保留已恢复的Hero横条，不再重做：八个Duik主面板的本地图标、中文文档入口、原横向循环与父级退场。当前桌面实际点击暂停得到`aria-pressed=true`，Return恢复`playing`；滚动后父级`opacity:0/pointer-events:none`，横条`paused`且有`inert`。先前一次locator点击因自动滚动进入退场区未生效，未计为成功；回顶后使用实际AX点击与键盘确认。普通`/`无诊断面板。首屏见`output/hero-ribbon-current-2026-11-03.jpg`。
- 共享核心的resize现在仅标记layout dirty，在下一次render中合并位图尺寸、camera和绘图；同尺寸不重新赋canvas宽高，离屏resize保留最后完成帧，恢复可见才同步。旧实现的8项受控回归为5通过/3失败，现实现通过；它证明真实清空风险，不将全部历史截图异常都归因于该风险。
- Hero按root幂等挂载，初次失败和运行期`rig-error`均切换为明确标注的静态原图，提供“重新加载角色”；各次attempt隔离监听/ready回调，卸载清理。原实现9项负控3通过/6失败，现实现9/9；不把静态poster计作完整绑定。
- 新`rig-diagnostics.mjs`只在loopback且`?rig-diagnostics=1`加载，读取当前实例已有buffer而非重画/另建实例；PNG解码期间出错、重试或卸载均作废旧采样，未ready时禁止诊断创建WebGL上下文。默认首页不改变。独立5项受控异步回归已固化并加入`landing:test`。
- `riglab deploy`验证批准26层并备份，同步共享核心/组件/工作台/ZIP，日志`output/hero-render-deploy-2026-11-03.log`；落地页三步发布日志`output/hero-render-publish-2026-11-03.log`。本批定向73/73通过（render/input/rig、Hero lifecycle、landing、ribbon/marquee），`output/hero-render-tests-2026-11-03.log`；另5项诊断回归单列，不宣称重跑整套。
- 实际浏览器：buffer为510×259，初次读取22836个非透明像素、26层、GL error=0；真实`WEBGL_lose_context`触发可见静态回退，点击重试恢复角色/控制器。左手键盘微调后`handL=[-5,0]`，buffer仍有22842个非透明像素；记录`output/hero-render-frame-2026-11-03.json`，回退/恢复画面为`output/hero-render-{fallback,retry}-2026-11-03.jpg`。本批drag驱动在shadow-root命中检查处失败，未以键盘结果冒充鼠标拖拽通过。
- 下半页源审阅未见API→目录/学习→FAQ→Footer的新阻塞，不重建现有模块。取得API当前可见画面`output/downstream-api-2026-11-03.jpg`；连续滚动捕获没有稳定覆盖预期衔接位置，不作整页视觉通过。墙体组合、圆环reduced-motion及完整整页最终验收仍待；持续goal保持active。
- 本批`npm run build`退出码0、137/137页，日志`output/build-hero-render-2026-11-03.log`；先停止已核实的本仓库dev，结束恢复3017，根页与诊断模块HTTP200，日志`output/dev-hero-render-2026-11-03.log`。5项诊断测试另见`output/hero-diagnostics-tests-2026-11-03.log`；核心、adapter、theme及诊断模块与public副本逐字一致，`git diff --check`通过。构建后根页角色与横条同屏见`output/hero-ribbon-handoff-2026-11-03.jpg`；读取该新页error日志为空，已返回普通`/`并保留预览tab。保留原多lockfile提示，未commit/push/远端deploy。

### 前批结果：绑定输入交接与专项验证器收尾（2026-11-03）

- Hero横条不重做：保持原循环/父级退场和八主面板中文入口。本次根页实际滚动至1896.25时opacity=0、paused、inert；返回时恢复playing与可聚焦。根页仍为`http://127.0.0.1:3017/`，没有启用候选页。
- 复现并修复接管阶段的选择脱节：先选头部再拖左手，原先仍显示面部关联。现在pointerdown/focusin同步部位、网格和真实层ID；关联行在接管阶段保留，选择不改变control镜头。独立复核进一步复现“旧键盘焦点被重建控件恢复”及被拒绝第二指针仍改选择的问题，已补先聚焦/同部位守卫/捕获归属判断。负控日志`output/workflow-target-{negative,focus-negative}-2026-11-03.log`。
- 共享输入核心取消陈旧drag并安全释放capture；禁用交互/隐藏控件、切模式、复位/导入姿态、播放、离屏和卸载均覆盖，显示网格与选择部位不取消正常拖动。`riglab deploy`先验证原图并备份，同步了工作台、组件、资源和ZIP，见`output/workflow-input-deploy-2026-11-03.log`；原26层SHA与像素合成不变。落地页发布见`output/landing-workflow-input-publish-2026-11-03.log`。
- 本批定向84/84通过（39工作流、8角色静态/IK、22共享输入、15验证器），见`output/workflow-input-final-tests-2026-11-03.log`。验证器五个包装器修正`data:`相对import，Reuse检查独立展开/收起真实details，失败恢复dialog与reduced-motion，使用取用快照断言；7脚本语法通过。只执行了Node与隔离import，不运行这些驱动的浏览器主体。新输入/验证器回归已加入`landing:test`，未重跑整套。
- 当前浏览器真实组合：1281×1086旧页中head键盘焦点→handL鼠标拖动，hand从(1050,655)到(1124.306,598.166)，Left微调到(1119.306,598.166)，选择fore-l、四个左臂层ID同步，scrollY及camera不变，Hero控制器未变化。1600×900独立根页再次确认角色贴图/骨骼随左手一起运动，见`output/workflow-control-visible-2026-11-03.png`；独立组件拖动和恢复也通过，画面见`output/rig-embed-current-2026-11-03.png`。
- 改姿重播实际显示26张展开层（`output/workflow-replay-layers-2026-11-03.png`），最后停在complete/control且保留原手部transform；显式复位回到(1050,655)。播放中暂停得到user/stage0，键盘进入接管后新鼠标拖拽有效。没有实际测试持针中切阶段/多指针；这些仅由Node输入回归覆盖。500ms姿态交接的逐帧美术验收仍待补。
- 捕获限制独立记录：旧页深滚截图以及一次首屏截图出现“仅SVG骨骼、无WebGL贴图”，但无console错误，独立组件和新根页绑定画面均正常。未确定是捕获还是产品渲染原因，不用DOM数值或后一次截图抹掉该异常，也未据此添加猜测性CSS修补。完整墙体组合、减少动态的圆环操作及整页最终审计仍待，goal保持active。
- 构建与服务：本批`npm run build`退出码0、137/137页，见`output/build-workflow-input-2026-11-03.log`。先停止已核实的同仓库dev，完成后恢复3017，根页HTTP200；服务日志`output/dev-workflow-input-2026-11-03.log`。`git diff --check`通过，保留既有多lockfile提示；未commit/push/deploy。

### 前批结果：Motion 与圆环可见验收、亮色呈现修复（2026-11-03）

下方逐批记录保留各自证据；陈旧的“尚无清晰截图”由本节更新，不据当前局部结果追认所有历史或整页检查。

- Hero 已恢复的八主面板横条保持：原横向循环、文档入口、暂停控制与父级滚动退场。当前桌面读到滚动678.75时父级opacity 0.1062、2153.75时0，横条暂停；22槽动态插画墙在后续画面可见。未重复全墙拖拽/暂停组合。
- Motion：同30%时间切换平滑/线性，实际进度由0.22变0.30；联动舞台真实拖拽令振幅32→64；摄像机三层展开与视点拖拽可见，拖拽前后scrollY不变。有限预览与完全离屏停止已核对。画面见 `output/motion-animation-capture-2026-11-03.png`、`motion-horizontal-transition-2026-11-03.png`、`motion-automation-drag-2026-11-03.png`、`motion-camera-depth-2026-11-03.png`。
- 圆环：已看到摄像机边界→环绕飞入→左环右文汇聚；真实鼠标/Enter选择与对应文档同步。实际退场读到旋转−272.313°、API顶部143.40px，见 `output/orbit-actual-exit-2026-11-03.png`；此前名为 `orbit-outgoing-quarter-2026-11-03.png` 的画面只有−216.44°，仅证明第五项后段，不作为退场证据。
- 可见问题修复：中文词行高/位移盒不一致导致下一行露出；改为一致的1.2行高、零下边距。原白色图标改用四枚官方SVG的alpha mask（五项共用两次library），保持源字节、14张原图序列、进度边框和原运镜。共享SSR/Vue映射拒绝错误名称/地址/缺样式/错误class，保留移动swiper活跃态。新图来源与通用审计限制见 `components/home/landing/icons/README.md`。
- 发布后当前1281×1086桌面：标题无残影，五图标可见；第一/第五项分别指向OCO/自检，选中图标及进度描边均为主题赭色，当前日志无warn/error。画面见 `output/orbit-light-presentation-2026-11-03.png`。发布与重复发布见 `output/landing-orbit-presentation-{publish,republish}-2026-11-03.log`，四个关键产物字节不变；定向62项中61通过、1可选浏览器项跳过，见 `output/landing-orbit-presentation-tests-2026-11-03.log`。独立审查6/6通过，未重跑整页runner。
- 本批 `npm run build` 退出码0、137/137页，见 `output/build-orbit-presentation-2026-11-03.log`。构建前停止已核实的同仓库dev，结束恢复3017，根页与新增图标HTTP200，日志 `output/dev-orbit-presentation-2026-11-03.log`；`git diff --check`通过，保留既有多lockfile提示。浏览器已回到根首页Hero，八主面板入口与playing状态可见，交付画面 `output/hero-ribbon-orbit-handoff-2026-11-03.png`。完整P1组合、墙体组合、reduced-motion手动圆环选择及整页最终审计仍单列，goal保持active。原角色不变，不commit/push/deploy。

### 阶段记录：原转场接回、镜头场景与文档修复（2026-11-03）

此段记录首次恢复转场与修复文档的结果；后续增量更新其待办状态。授权包含文档壳/中文导航/404修复，正文与上游保持只读。

- 原空场根因：`HomeCapabilitiesTestimonialKP` 被普通复用面板替换，但父 `HomeCapabilitiesKP` 仍传递 `mergedProgress`。现恢复原8图轨道与三段时序、五项选择及键盘操作，使用本地功能插画静帧；复用工作台收入详情，额外 ScrollTrigger 在卸载时清理。
- 绑定：26张原透明层透视展开→错峰归位→关联镜头→控制接管。改姿重播用中立渲染连续返回已存姿态，不重置用户数据；中断归位不遗留 hidden/inert。API：单宽幅舞台表达三条真实调用，有限播放/进度拖动；不执行AE。目录：8主面板视觉索引，33入口检索折叠；学习仍保留五任务/16条路线。
- 文档：默认亮色与独立主题存储，正文背景跟随；导航去除外层Docs/Index，恢复固定官方顺序，通用标签中文化。`/docs/docs/...` 308跳转；MDX链接按真实源文件目录解析，根/嵌套index不再丢失`/docs`。中文控件补丁可在干净安装复现；未改译文正文。
- 本轮发布：`output/landing-orbit-publish-2026-11-03.log`；`landing:test` 145项，144通过、0失败、1可选浏览器项跳过；另 API cinema 9/9。最终文档导航与HTTP **9/9**，含真实MDX编译和SSR链接，见 `output/docs-shell-tests-final-2026-11-03.log`。这些是代码/HTTP证据，不是整页视觉完成。
- 浏览器实际点击已打开贡献指南；重启后从旧双前缀地址进入，最终URL为`/docs/advanced/contributing-guide`，文章存在、背景`rgb(255,255,255)`、主题`light`、双前缀链接0个。展开骨骼目录确认“骨骼简介 / 自动绑定简介 / 骨骼工具”，截图见 `output/docs-light-2026-11-03.jpg`。根页读到原8图变换和5项控件，但截图接口连续返回空白，而DOM仍报告可见；尚未取得本轮可靠的圆环画面，不能认定可见转场验收通过。Nuxt仍有水合 mismatch 日志，继续定位；工具比较段、三类横向场景与全页过渡仍待进一步改造。
- 最终 `npm run build` **退出码0、137/137页面**，见 `output/build-docs-orbit-2026-11-03.log`；构建前停止dev，结束恢复同仓库3017，文档与本地圆环图标HTTP复核。保留多lockfile、浅克隆修改时间提示；没有commit/push/deploy，整页goal保持active。

模板源与适配取舍见 [体验方案：原模板能力审查](./LANDING_EXPERIENCE_DESIGN.md#原模板能力审查2026-11-03)。优先恢复被丢掉的完整运动链，再改造 Tools 比较舞台与横向三场景，不继续叠加解释面板。

### 当前增量：亮色首帧、底部横向条带与新演示（2026-11-03）

- 导航闪黑根因：原 SSR 输出 `blur-overlay`，adapter 挂载后才追加中文导航并隐藏旧结构。改为 SSR/HeaderKP 共用 `navMarkup`，保留原滚动显隐与菜单生命周期；实际 HTTP 从 `{lightSSR:false,blackOverlaySSR:true}` 变为 `{lightSSR:true,blackOverlaySSR:false}`，浏览器刷新及上下滚动后均只有一个中文导航、0 个旧遮罩。
- 主背景：原画布曾被压到 `.055`；现从固定 `WebGLBackgroundCore` 改纸色底及绿/赭/淡金配色，保留原 UV 变形、滚动速度、脉冲与场景权重，画布显现后为 `.78`。浏览器 Hero 已看到可辨识色带；主时钟/renderer 覆盖后台与 reduced-motion，独立 `GlowingEdgeOverlayCore` 尚未纳入同一暂停范围。
- Tools：保留一张固定参照，以同套构图演示裁边、图层分开、批量命名和脚本片段取用；详细编辑器/26层角色进入默认关闭详情。26层原角色未改。显式有限播放、手动进度、接管和暂停由共享舞台管理，原 `data-tools-intro` 契约已移除。
- Motion：插值用同路径双对象比较节奏；自动化用嵌套位置/旋转/缩放的悬挂装置；摄像机用原创三景层山景及有限运镜。前台重新可见不自动重播，手动视点保留。三张父级标题也已从 payload 完整同步至 SSR，清除英文首行残留。
- Hero 底部条带已恢复并发布：原 `Rt` 三列曾整条 `display:none`，左视频和右奖项也被移除。恢复原位置、循环与父级退场，中央从 `panels` 派生八个官方图标/中文文档入口，左侧为面板入门、右侧为暂停控制；不恢复远程视频或借用奖项。首份键盘可达，副本去重，悬停/中央链接焦点/后台/透明退场暂停，减少动态时单份静态浏览；暂停按钮本身的焦点不阻止继续流动。
- 本批最终三步发布见 `output/landing-hero-ribbon-focus-publish-2026-11-03.log`。最新代码测试为 **176 项、175 通过、1 可选浏览器项跳过、0 失败**，见 `output/landing-hero-ribbon-focus-tests-2026-11-03.log`，取代本增量较早的169/175项计数。这不是整页浏览器验收。
- 横条实际浏览器操作：挂载后测得2份轨道、21秒周期、8个可Tab入口；原位鼠标暂停及Enter恢复保持`scrollY=0`，向下滚动至`scrollY=1320`时父级`opacity=0 / pointer-events=none`且轨道暂停。回到顶部后键盘进入单份静态浏览，Enter打开`/docs/guide/cmd`，页面标题为“命令行”。构建后返回根首页再次确认8个入口、轨道playing、旧导航遮罩0个；首屏截图见 `output/hero-ribbon-viewport-2026-11-03.jpg`（完整视口）与 `output/hero-ribbon-final-2026-11-03.jpg`（原始截图）。
- 复核补充：原退场只改透明度与指针事件，仍可保留不可见的键盘入口。新增回归先失败、修复后5/5通过；整条`ribbon`随父级退场设置`inert`，含入门链接和暂停按钮，返回/卸载恢复原边界。真实滚动至`scrollY=2002.5`读到`opacity=0 / inert=true / paused`，Home返回后为`scrollY=0 / opacity=1 / inert=false / playing`。
- 含焦点修复的最终 `npm run build` **退出码0、137/137页面**，见 `output/build-hero-ribbon-focus-2026-11-03.log`；前一轮记录保留于 `output/build-hero-ribbon-2026-11-03.log`。构建时停止dev，结束后恢复本仓库的 `127.0.0.1:3017`，根页HTTP 200。保留既有多lockfile警告；没有commit/push/deploy。
- 未完成边界：工具/圆环的非首屏截图仍出现空白，而 DOM 几何与命中检查正常；重置临时 viewport 后仍未取得可靠画面，不能据此宣称滚动舞台已视觉验收。独立边缘光效的后台暂停、全页镜头衔接和最终整页验收继续待办，持续goal保持active。

首屏代码真源：`scripts/lib/landing-navigation.mjs`、`landing-background.mjs`、`landing-hero-ribbon.mjs`、`landing-hero-marquee.mjs`，内容/样式与生命周期位于 `components/home/landing/`。继续通过三步 `landing:publish` 派生 public；未经本轮实际验证的项目保持待办，整页 goal 仍 active。

### 当前收尾：Motion 画幅与独立边缘光（2026-11-03）

本节更新上方“独立边缘光未处理”的状态；不覆盖历史证据，也不宣称整页视觉验收完成。

- Motion 三画幅保留5:3原比例，主操作收为紧凑控制带；标题与舞台上沿对齐。参数在画幅内局部展开，不压缩场景、不改变原父轨道测量值；短桌面按完整画幅比例收窄。原3.4/4/4.8秒演示时长不变。
- 自动预览由55%改为主画幅至少90%可见，并在启动时核对实际可见面积，避免过早通知消耗一次演示。保留显式播放、用户接管、退场停止且不自动重播；对应红→绿回归已运行，Motion共31项通过。
- 独立 `GlowingEdgeOverlayCore` 从精确原始baseline经 `patchGlowLifecycle` 发布；四段shader与可见时间参数不变。16项VM/WebGL替身回归覆盖后台RAF/GSAP、reduced静帧与透明清屏、延时取消、陈旧回调和卸载，另1项核对实际发布文件与转换结果一致。原版同套生命周期检查为13失败、2通过、1转换器项跳过；这不是浏览器GPU视觉验收。
- 最终三步发布日志：`output/landing-motion-glow-publish-2026-11-03.log`；`landing:test` **198项、197通过、1可选浏览器项跳过、0失败**，见 `output/landing-motion-glow-tests-2026-11-03.log`。Impeccable对三个修改文件的layout检测为`[]`，仅作静态信号。
- 实际浏览器1281×1086：原位点击自动化参数后 `open=true`，舞台仍为791.15×474.69；参数浮层止于y471.46，播放行在y714.04且真实命中。鼠标播放后进度0.60/playing，暂停后0.65/stopped，随后保持0.65；展开、暂停不移动页面，scrollY=8347.5。定位器自动滚动曾把横向目标带离屏，因此该次失败不算组件通过；原位操作结果单独记录。
- Hero仍有八面板横条与亮色背景，新首屏截图为 `output/hero-ribbon-final-2026-11-03.jpg`。非首屏截图与实时DOM坐标不一致，`output/motion-controls-observed-2026-11-03.jpg`仅为捕获异常证据；不能认定圆环/三段运镜视觉通过。圆环终态DOM覆盖视口，未发现可证实的隐藏规则，本轮未添加猜测性containment补丁。
- 最终 `npm run build` **退出0，137页**，日志 `output/build-motion-glow-2026-11-03.log`。构建前停止dev，结束恢复同仓库3017；保留既有多lockfile提示。未提交、推送或部署。短桌面视觉、完整圆环运镜与整页最终验收继续待办，goal保持active。

### 最新收尾：上下文入口、调用关系与轨道重测（2026-11-03）

- Hero 底部横条保留已经确认的恢复结果，本批不再重做或重复测试；最近确认截图为 `output/hero-ribbon-confirmed-2026-11-03.jpg` / `output/hero-ribbon-detail-2026-11-03.jpg`。整页目标不因这项完成而关闭。
- Impeccable distill 删除三张 Motion 卡片的重复全局双 CTA，保留各场景文档入口；圆环改为一条随原选择/移动 swiper 更新的入口，依次对应 OCO、动画库、脚本库、笔记、自检。SSR/Vue 同源，未知结构、孤立标记或新旧映射混存会中止发布；修正 Hero 安装链接在初始 SSR 的目标，不删除 Hero 主行动。Taste 保留开放排版，不新增卡片壳。
- API 在同一舞台正常流展示“对象 → 真实调用 → 结果”，从 `apiExamples.call` 读取原三条调用。Emil animate 仅在已有调用阶段强调该行，保留4200ms时间线和控制器；初始化、复制与官方截图仍在默认关闭详情，不执行 AE。
- resize 根因有两处：原 production 首次交互后跳过重算；原 render 仍可写回 `auto 500px` 测量占位。修复为 RAF 合并、Vue nextTick 等分支、原测量与时间线、nextTick 等 spacer、ScrollTrigger.refresh，并从该宿主 SSR/Vue 同时移除占位。保留原 `a=3`、`D=1.8`、`f*1.6+w` 等公式、当前物理滚动位置及其它区块优化；不把未经证实的回写归因于 GSAP revert。
- 三步发布和幂等复发日志：`output/landing-context-motion-publish-2026-11-03.log` / `output/landing-context-motion-republish-2026-11-03.log`；本轮定向测试 **62/62通过**，见 `output/landing-context-motion-tests-2026-11-03.log`，未重跑旧198项或整页runner。另只读审查确认完整链接补丁与实际发布模块幂等、语法和映射正确。Impeccable 静态扫描无发现，不作为视觉证明。
- 浏览器一次 resize/reset：实际 CSS 视口1281×1086 → 1601×1125 → 1281×1086，spacer 为9569.58 → 10957.1 → 9569.58px，宿主高10655.82 → 12082.13 → 10655.82px，宿主 style 始终为空，不再缩到500px。工具 API 设置值并非实际 CSS 视口，以上记录以页面测量为准。恢复后点击导航“脚本 API”，滚动稳定后 API 顶部84.57px、scrollY18190，锚点正确。
- 本轮实际读到中段四组旧双CTA为0，圆环入口能随原状态从OCO更新为自检；五条目标均有本地文档，但本轮未逐条点击导航。API 实际切换调用阶段和自动父级示例，对象、调用、结果、文档同步且详情关闭。`output/api-call-relation-observed-2026-11-03.jpg` 仅为局部关系行证据，捕获仍存在偏移，不作完整API视觉验收。
- 本轮 `npm run build` **退出码0、137/137页**，见 `output/build-context-motion-2026-11-03.log`；构建前停止本仓库dev，完成后已恢复 `127.0.0.1:3017`，根页HTTP200，`git diff --check`通过。保留既有多lockfile提示。目录/学习重复大插画的重编排、完整圆环运镜及整页视觉验收仍待推进，goal保持active，不commit/push/deploy。

### 最新收尾：目录与学习去重、阅读入口前置（2026-11-03）

本节更新上批“目录/学习重复大插画待重编排”的状态。Hero横条、已确认角色、原圆环运动链、FAQ与Footer实现均未在此批重做。

- 按 Impeccable distill / Taste 区分模块职责：前面的墙和可操作舞台承担视觉体验，此处承担找工具与继续阅读。目录删除一张放大海报及八张封面，学习删除21处重复封面/缩略图；不加新的装饰循环，Emil animate保留已有180ms指针切换与即时键盘反馈。
- 目录首层直接显示搜索、八个官方小图标分类和当前结果，默认四条骨骼入口。保留33条精选工具、Tools四组、空态恢复、方向键/Enter/Escape；“全部”清空搜索并同步标题/指南。官方截图保持原固有尺寸、默认关闭。
- 学习保留五任务、五主文档及11条后续链接；用开放式主阅读/后续路线代替重复大卡。安装步骤与292×529面板保留在详情，路径建议和能力边界保留。真源仍是 `guide-experience.mjs`，SSR/Vue同源发布。
- 主代理执行完整三步 `landing:publish`；定向51项中 **50通过、1可选浏览器项跳过、0失败**，记录为 `output/landing-reading-index-tests-2026-11-03.log`。发布一致性、路由、幂等清理和反馈生命周期在该组范围内；未重跑整页runner。
- 实际浏览器使用原预览页、原1281×1086桌面：Tools显示四组/9入口，“全部”显示33入口；无结果恢复、裁剪唯一结果、分类方向键、五任务点击/唯一可见内容及各自链接均确认。学习区从1122.25px变为582.73px；此为DOM布局测量，不是截图验收。Home键返回安装任务且反馈idle。Tools原图读到423×197，实际比例2.14735；搜索结果Enter到达 `/docs/guide/tools/composition/crop` 并显示“裁剪预合成”。导航调用曾超时，但随后独立读取实际URL与h1确认成功，未重复激活链接。
- `validate-duik-experience.mjs` 补强首层搜索、无墙体重复图片、全部标题/数量、学习唯一可见panel及具体href检查。本批未执行该CDP runner，浏览器操作来自CUA；不能把脚本更新写成该runner通过。
- 深滚动视口截图仍返回纯底色，完整页面捕获也未成功；`output/reading-index-current-2026-11-03.jpg`只记录异常。没有据此添加猜测性CSS或宣称视觉通过。原圆环完整运镜、整页衔接与最终视觉验收继续待办。
- `npm run build` **退出码0、137/137页**，记录为 `output/build-reading-index-2026-11-03.log`；构建期间停止本仓库dev，结束恢复同仓库3017，根页HTTP200，`git diff --check`通过。用户原预览页已返回最新根首页，首屏与底部横条截图为 `output/reading-index-hero-handoff-2026-11-03.jpg`；它不替代下半页视觉验收。保留既有多lockfile警告；无commit/push/deploy，整页goal保持active。文档按doc-workflow关联校对，AGENTS仅追加当前首层契约，详细证据集中于本节。

### 最新收尾：圆环准确选择与图层标记叙事（2026-11-03）

Hero八面板横条沿用已恢复版本，本批不重做。Impeccable/Taste继续沿用现有开放舞台；Emil animate保留同一有限播放头，不添加装饰循环或新面板。

- 圆环原选择函数在时间线反算后又减固定像素，导致第五项在较短滚动区间落回第四项。发布转换只移除该偏移，保留原三阶段、几何、滚动归属与时长。真实父事件→本地GSAP时间线→原子选择→文档目标回归覆盖五项、反向切换、resize与原生滚动后备；原代码负控6项失败，新逻辑及实际public字节一致性通过。
- 图层首层在原四几何构图中逐项整理预设名称，所选图层同步名称、组别、侧别与“美术（Art）”类型；标签跟随拖拽/隔离，进度回退恢复源名。同一3300ms有限播放头保留暂停、接管、复位与离屏约束。官方Layer Manager依据固定文档及`Duik.Layer.Type.ART`；不识图、不复刻命名算法或修改AE工程，26层角色和真实面板仍在详情。Motion短文案改为“路径不变”，避免不同节奏却称位置始终相同。
- 完整三步发布日志：`output/landing-selection-layer-publish-2026-11-03.log`。本批定向 **96/96通过**，见 `output/landing-selection-layer-tests-2026-11-03.log`，包含实际发布父模块一致性；没有重跑整页runner，代码回归不是视觉证明。
- 当前桌面实际操作：图层选“绿色形状”显示片头/左/美术；Home回退后恢复`Art_片头_L_绿色形状`和未整理字段；单次播放从running/15到complete/100并停下。真实拖拽后美术与标签同为`translate(-33.808420070809234 5.252368995288862)`；切文本后标签/字段均`display:none`。
- 圆环实际原位点击第五→第一→第五，第一项链接为`/docs/guide/oco`，第五项为`/docs/guide/sanity`；随后Enter反向切换同样保持第五项选中及正确链接。本批只确认链接目标，没有另导航文档；该次浏览器错误日志读取为空。深滚动截图此前持续返回纯底色，本批没有重复无效探测或猜测性CSS修补，完整运镜/整体衔接视觉验收仍未完成。
- 本批 `npm run build` **退出码0、137/137页**，见 `output/build-selection-layer-2026-11-03.log`。构建前核实并停止本仓库dev，构建后恢复3017（`output/dev-selection-layer-2026-11-03.log`），根页与自检文档HTTP200；保留既有多lockfile提示。四个本批源模块与public副本逐字一致，`git diff --check`通过。返回原预览首页后八个可Tab面板入口仍在，首屏截图为 `output/selection-layer-hero-handoff-2026-11-03.jpg`；该图不代替非首屏视觉验收。持续goal保持active，不commit/push/deploy。

### 最新收尾：开放双画幅与原滚动曲线（2026-11-03）

- Hero八面板条带本批只确认，不重做：原循环、暂停、键盘与父级退场保持。源码对比确认`HomeDifferenceKP`本身是双画幅、直接操作和双路径描边，不存在另一个pin/缩放穿梭。其它主场景已有实现，修正体验方案里陈旧的“待重做”，不因此追加新模块。
- Impeccable合并重复标题；Taste将Tools收束为同一760×480坐标、等列、对齐顶边的开放比较；Emil animate只补两条原路径随滚动描边。工具模型、3300ms有限播放、图层元数据、26层角色及详情均未重做。全页背景注册暂不接回，避免改动相邻色场与异步队列。
- 新增`tools-comparison-motion.mjs`，同源延迟加载现有GSAP，离屏/后台销毁局部trigger，返回按当前位置采样；reduced-motion与加载失败显示完整静帧。未添加pin/spacer或新的工具进度。审查发现外围初始化异常会使工具disposer丢失，先运行失败回归，再隔离异常；工具继续可用且可卸载。
- 三步发布：`output/landing-open-comparison-publish-2026-11-03.log`；定向**55/55通过**：`output/landing-open-comparison-tests-2026-11-03.log`，含SSR/客户端和实际public一致性。未重跑整页runner。
- 当前1281×1086桌面：左右SVG均为558.59×352.79，y同为449.02；点击裁边后352×272，两参考点仍为`translate(380 240)`。真实滚动7070→7398.75时左描边offset由752→42，工具仍是manual且结果保持352×272。按当前DPR≈0.8换算截图clip后取得清晰工具画面：`output/open-comparison-before-2026-11-03.png`；此前空白至少与捕获坐标不一致有关，本批未修改浏览器缩放或猜测性CSS。该图只证明此处构图，不替代完整圆环运镜和整页衔接验收。
- `npm run build`退出码0，137/137页：`output/build-open-comparison-2026-11-03.log`。停止已核实的同仓库dev后构建，结束恢复3017（`output/dev-open-comparison-2026-11-03.log`），根页与新模块HTTP200，`git diff --check`通过。保留原多lockfile提示，无commit/push/deploy。整页goal继续active，后续以当前可用的定向截图做可见验收，不再以陈旧待办反复重造模块。

### 0.1 设计 Skills 安装记录（2026-11-01）

**最新执行约束优先于下文历史基线。** 用户再次指出：封面没有铺满、装饰底板太多、新区块仍是简单面板加文字。这些均是待修问题；不能只调配色、切默认标签或补几句文案后宣布重设计完成。以下 Skills 已应用于本轮，但整页尚未验收。

本轮已实际读取 web-clone 本地参考：`sites/linearity` 的三个 `HomeCapabilitiesDiagramKP*`（完整横向舞台及输入—处理—结果关系）、`sites/voicestudio/app.js`（选择内容、直接控制播放/参数、离屏暂停）和 MotionFun 的本地归档说明。MotionFun 是带远程媒体的编译运行副本，不可直接作为本地离线组件交付；没有把其远端视频或占位图引入本页。

### 最新实施批次：铺满封面与动态场景

**后续用户决定已生效（2026-11-02）：图片墙不用真实截图，改成动态功能插画；卡片下方常驻模块标题和一句用途。** 22 张 SVG + 22 张静态 WebP 已写入本地发布链。此前 18 张静态真实图 + 4 张动态示意、以及仅悬停标题的方案均被替代；旧 10 组结果不能冒充本版验收。

| 范围 | 本轮已写入真源并发布 | 当前边界 |
|---|---|---|
| 原22槽墙 | `hero-wall-art.mjs` 原创动态功能插画；22 SVG/22 WebP，`cover` 铺满，卡片下方常驻模块名/一句用途，统一暂停与离屏静帧 | 原卡片几何、滚动缩放、拖拽与文档链接保留；不是22个新主面板，不含面板截图 |
| 墙中央标题 | 三阶段统一为角色绑定／动画制作／日常创作，共用“都能更顺手。”后缀和一句用途；清除旧拆层流程及重复标题行 | SSR与payload已同步；保留原轮换时序，本批浏览器控制被设置禁用，实际滚动交接待复核 |
| 认识 Duik / 绑定 | 一句定位 + 官方工作区图；同一个26层角色按拆分、关联、控制切换，真实部位图层/网格与彩色控件响应 | 真实面板与步骤按需展开；不运行 AE 自动绑定，不修改角色 |
| 动画 / 自动化 | 效果优先、单次入场解释；用户直接接管、暂停、复位；删掉重复的首层操作说明 | 现有几何场景仍需沿模板的整屏叙事继续提升，不能仅凭功能可用称设计完成 |
| 摄像机 | 三个独立景层可拆开/合回；拖拽视点改变真实分层位移，滑杆收进二级控制 | 网页视差原理示意，不是 AE 面板或 Duik 默认参数 |
| 工具 | 四个可操作场景前置；裁边一次性演示/接管，图层显隐，批量名称流，脚本编辑；原图步骤收入详情 | 网页样本不修改 AE；新宿主验收单独记录 |
| 复用 | 选择→本页示例库→取用的大舞台，含真实素材/动作分镜/代码片段；官方三库收进详情 | 不写 OCO/duio、不执行脚本、不新增角色；新宿主验收单独记录 |
| API | 三条真实调用共用关系舞台；有限播放/暂停/复位、阶段跳转与拖动进度，前提和官方图收进详情 | 本批定向8/8；仅原理示意与复制，不执行AE，不是完整API命名空间图 |
| 学习 | 五个任务各一个主入口，保留11条后续链接；官方参考收进详情，指针有限反馈、键盘即时 | 本批定向6/6；原16条文档路由不减少 |
| 目录 / 收尾 | 目录改成开放式检索，八主面板/33入口保留，官方图按需展开；FAQ默认四个入门问题；页脚收束为安装行动和官方获取 | 源码与发布已完成，当前验收结果见下节；不添加装饰循环或伪面板 |
| 全页衔接 | 收尾顺序调整为API → 目录/学习 → FAQ → Footer，SSR与Vue同步 | 上半页过渡、整体视觉叙事及全范围完成审计仍待推进；整页目标未完成 |

最新验证记录统一追加在本节后；旧60项、19组及137页记录均不覆盖本批。不得把墙、绑定或摄像机局部通过推导为整页完成。

#### 本批证据：动态封面与常驻下方说明（2026-11-02）

- 真源已通过三步发布链同步到根首页；22 张封面分别具有模块名和一句用途，不依赖悬停。标题/用途与 SSR、Vue 运行时使用同一映射，原卡片几何和角色 SHA 未改。
- 当前模块/发布测试：85 项总计、84 通过、1 项可选浏览器跳过、0 失败，见 `output/landing-tests-captions-2026-11-02.log`。跳过不算通过。
- 图片墙定向桌面：1440×1000 的 12 组检查通过，见 `output/playwright/hero-wall-captions-final/report.json`。覆盖常驻下方说明、铺满比例、动态 SVG/减少动态效果静帧、键盘暂停/恢复、真实拖拽与鼠标/键盘文档跳转。根首页阶段脚本错误、失败请求与外联为空；独立 SVG 采样时浏览器默认请求 `/favicon.ico` 返回 404，不能宣称所有阶段零失败请求。
- 播放按钮移出带位移和裁切的墙体宿主，仅有封面可见时固定在视口角落，避免滚动后按钮已经离屏。真实按键验证发送完整 Enter 字符事件；图片 source 切换验证等待实际资源解码，不用固定延时判断。
- 本批 `npm run build` 退出码 0、137/137 页，见 `output/landing-build-captions-2026-11-02.log`。构建前已停止本仓库 dev，完成后恢复 `127.0.0.1:3017`，根路由 HTTP 200。
- Tools 的 8 组新场景检查在本批整合运行中通过。`landing:verify` 已移除旧截图/supplement/table 契约，当前共 29 组；初次运行 26 通过、3 个 Reuse 检查失败，记录保留在 `output/landing-verify-captions-2026-11-02.log` / `output/duik-experience-check/report.json`，不标成全量通过。首页脚本错误/失败请求为 0，真实 Nextra 导航 HTTP 200；文档既有 favicon 404 与官方视频外联分开记录。
- Reuse 后续定向复核 **7/7 通过**，见 `output/playwright/reuse-scenes/report.json`。定位到旧驱动每次点击都会重新求解横向滚动，错过 1.3 秒单次分镜的停止时机；另一个失败是首次文档编译超过 CDP 25 秒超时，继而留下展开态污染后续检查。已修正为可见控件直接点击、观察真实分镜后停止、独立请求文档状态，不修改组件来迎合测试。新命令 `node scripts/validate-duik-reuse.mjs`；当前完整 29 组未在驱动修正后重跑，7 组结果不冒充全量结果。
- 此墙体批次结束时 API/学习仍未完成；它们的后续实现见下一节。整页视觉/节奏衔接仍待推进，以上不是整页完成证明。

#### 后续批次：API 关系舞台与学习入口（2026-11-02）

- 已通过完整三步 `landing:publish` 同步真源和生成产物，见 `output/landing-publish-api-learning-2026-11-02.log`。API 改为手臂绑定、抖动、父子关联三种几何关系场景；2400ms有限时间线可接管/暂停/复位。学习区保留五任务与16条文档路由，首层删减为五个主入口加11条后续链接，不改变FAQ/Footer。
- 最新模块/发布测试：**90项总计、89通过、1项可选browser跳过、0失败**，见 `output/landing-tests-api-learning-2026-11-02.log`。
- API 定向 **8/8通过**，见 `output/playwright/api-scenes-final/report.json`；首轮7/8保留在 `output/playwright/api-scenes/report.json`。已将根状态改为 `data-api-position`，与范围输入的 `data-api-progress` 分离；真实焦点/键盘/拖动复核通过。后台分支使用受控 `document.hidden` 模拟，不宣称物理切换标签页实测。
- 学习定向 **6/6通过**，见 `output/playwright/learning-paths/report.json`；包含真实指针180ms反馈、即时键盘选择、减少动态效果、官方292×529面板、卸载重挂载和真实Nextra骨骼文档导航。该次脚本错误/失败请求均为空，不覆盖历史其他文档的favicon或视频外联。
- 本批 `npm run build` **退出码0、137/137页**，见 `output/landing-build-api-learning-2026-11-02.log`；构建前停止本仓库dev，构建后恢复3017。多lockfile workspace-root警告未在本批处理。
- 完整29组整合runner本批未重跑，保留此前26通过/3个Reuse驱动失败及后续定向7/7记录；不将API/学习定向结果冒充全量通过。全页过渡、目录与FAQ/Footer的整体叙事仍待复审；持续目标保持active，未提交/推送/部署。

#### 后续批次：目录与收尾编排（2026-11-02）

- Impeccable distill 删除目录侧栏壳和首层大截图，保留搜索、八主面板、33个精选入口、空结果恢复与键盘操作；真实面板进入默认关闭的详情，九种视图尺寸均与固定官方PNG核对。
- Taste 沿用暖纸色/墨色/橙色和现有排版，使用开放式索引而不是新造AE面板；FAQ默认四个入门问题，其他七个保留在分类与全部入口，回答默认折叠。移除页脚无操作含义的纸张插画，把主行动收束到安装指南，官方获取和归属链接保留。
- Emil animate 的门槛在这里选择“不增加动画”：检索、键盘导航和问题阅读即时反馈；已有API、角色和工具场景继续承担功能解释。
- 原三宿主改为API → 目录/学习 → FAQ，再接Footer，SSR与客户端映射一起改。发布器根据实际宿主位置分配内容，避免直接重复发布时再轮换；相关源码合约已增加顺序断言。
- 最新模块/发布测试 **92项总计、91通过、1项可选browser跳过、0失败**，见 `output/landing-tests-closing-2026-11-02.log`。完整三步发布日志为 `output/landing-publish-closing-2026-11-02.log`；单独重复第三步后首页SHA保持一致，收尾顺序幂等。
- 本批完整31组整合首轮为 **30通过、1个分镜停止检查失败**，见 `output/landing-verify-closing-2026-11-02.log` / `output/duik-experience-check/report.json`。首页脚本错误/失败请求为0，真实Nextra导航HTTP200；文档favicon404和官方视频外联仍单列，不宣称全站离线。
- 分镜停止检查原先在观测到中间帧后继续多次求解位置，依赖剩余650ms窗口；改为先独立观察完整0/1/2帧，再用预先验证的位置发送真实播放/停止点击，并记录点击前后状态。**未改分镜动画本身**。最终定向7/7通过、24组未执行，见 `output/playwright/closing-final/report.json`；记录包含 trusted=true 的 playing→user，之后帧保持不动。7组覆盖新版目录、官方图比例、收尾顺序、学习/FAQ/Footer、分镜与真实文档导航，不冒充完整31组重跑。
- 单次桌面画面审阅后修正目录箭头换行、学习区重复内外留白；当前可编辑真源和发布产物一致。`LANDING_CHECK_FILTER` / `LANDING_CHECK_OUTPUT` 可复用定向验证，报告明确列出filter及skippedChecks，未执行不是通过。
- 本批 `npm run build` **退出码0、137/137页**，见 `output/landing-build-closing-2026-11-02.log`；构建前停本仓库dev，完成后恢复3017。多lockfile警告仍保留；无commit/push/deploy。
- 后续重点是上半页Hero进入图片墙的标题切换、跨区停留与整体视觉叙事，并在最终版本重新完整验收；当前只完成本批收尾，不标记整页目标完成。

#### 后续批次：墙中央标题与功能叙事（2026-11-02）

- 已有墙体截图暴露旧“拆分图层”与“从角色绑定，到日常创作。”同时出现。源码定位到 `introTitleList` 仍来自旧流程、`introTitle` 已独立更换，模板会将两者同时渲染；不是卡片标题缺失。
- 新 `heroWallIntro` 统一三阶段和共同后缀，说明分别指向绑定、动画与通用工具。去掉重复小标签及空标签行，划线与阶段指示使用既有橙色；保留轮换、墙体几何、拖拽、22张下方说明和批准角色。依据 Impeccable 删减重复信息，按 Emil 门槛不添加新的动画。
- 发布器同步 Vue 的条件标题行：前缀为空时 SSR 输出注释，不残留第三行；新增两项合约测试覆盖阶段说明、两行结构与空/非空前缀。
- 完整三步发布成功，见 `output/landing-publish-hero-flow-2026-11-02.log`。代码测试 **94项总计、93通过、1项可选browser跳过、0失败**，见 `output/landing-tests-hero-flow-2026-11-02.log`。
- `npm run build` 退出码0，见 `output/landing-build-hero-flow-2026-11-02.log`。构建前已核对3017进程属于本仓库并停止，构建后恢复原端口；多lockfile警告保留。
- 浏览器连接返回 `Local browser use is disabled in Work settings`。本批未绕过设置运行其他浏览器，不把已有截图或源码合约算作本批视觉/水合/滚动验收。实际标题交接、跨区停留、全局视觉叙事和最终完整审计继续待办，持续目标保持active；未commit/push/deploy。

#### 后续批次：motion 主舞台与自动预览接管（2026-11-02）

- 三类横向 motion 舞台扩大到卡片可用宽度，并同时收紧模板父级轨道 gap；不篡改 GSAP 的宽度测量或滚动时间线。模板标题实际为段落类名 `.h2`，不能仅针对原生 h2。
- 插值与自动化的核心场景置于首层；细参数收入默认关闭的 details。动画保留关键帧插值控制、播放/暂停/复位和进度拖动；自动化增加轻晃/自然/活跃三个网页示例预设；摄像机三层拖拽/拆合保持。官方面板参考仍按需展开。
- 修复一次性自动预览的暂停交接：播放按钮的 pointerdown/focusin 不得提前关闭自动预览；聚焦仍维持有限演示，真正 click 才由用户接管，避免首次“暂停”被随后的 click 再次启动。
- 代码测试 `102项 / 101通过 / 0失败 / 1跳过`，见 `output/landing-tests-motion-stage-final-2026-11-02.log`；跳过不算通过。标题元数据发布仅改 HTML head title，不误改 SVG title。
- `npm run build` 退出码0，137/137页，见 `output/landing-build-motion-stage-final-2026-11-02.log`；构建前停止本仓库3017服务，随后恢复，根路由 HTTP 200。`git diff --check` 通过。
- 本机 Browser 在 Work 设置中禁用，本批未做新截图、视觉/水合/滚动验收，也没有绕过设置启动其他浏览器。源码/HTTP/单元测试结果不冒充浏览器验收；整页目标继续 active。

#### 后续批次：Hero 语句与复用接收结果（2026-11-02）

- Impeccable clarify：Hero 轮换为“在角色动画中，用绑定工具打磨动作细节”等句子，静态连接词、三类素材和可访问摘要共用 `content.mjs`。发布器同步 SSR/Vue，锚点不匹配即停止；保持原 pill 轮换和动效。绑定入口改为“查看分层”，说明素材已准备，避免暗示自动拆图。
- 复用区分离待选、已存与已取用结果；右侧保存取用时的 `{id, frame}`，新选择、分镜播放和保存不再改变接收结果，取用也不改待选对象。待选分镜控件移至左侧，库缩略图显示已存帧，接收图显示已取用帧；脚本同样保留已取用文本，不执行代码。
- Emil animate：保留280ms对象移动反馈，目标改为接收画面，移动素材使用实际已存帧，落点对应持续显示的结果；键盘即时，离屏/后台暂停、减少动态效果和清理逻辑保留。Taste 沿用开放三列舞台和现有配色，不新增面板壳。
- 完整三步 `npm run landing:publish` 成功；`landing:test` **104项总计、103通过、0失败、1项可选browser跳过**，见 `output/landing-tests-copy-reuse-2026-11-02.log`。其中20项复用测试执行真实模块事件/状态逻辑，新增已取用分镜与脚本持续性回归；本地DOM适配器不是浏览器视觉验收。
- Impeccable 对4个改动UI文件的 detect 返回空数组，不代表视觉通过。浏览器仍为设置禁用状态，本批没有新浏览器验收。当时未补记构建退出码；复查 `output/landing-build-copy-reuse-2026-11-02.log` 已有完整路由汇总，进程已不在运行，不再作为“构建中”等待。新一批发布构建单独记录；整页过渡及最终视觉审阅仍待办，持续目标 active。

#### 后续批次：完整绑定舞台与墙后衔接（2026-11-03）

- Impeccable distill/layout：将“认识 Duik”收束为短衔接，保留 `#inside-ae`、官方工作区详情与文档入口；绑定区移除左小画布/右大说明的结构，改为完整场景、底部阶段选择和短说明。关联图层信息只在第二阶段出现，桌面侧置，较窄窗口回到正常流，避免遮挡角色控件。三阶段及批准26层不变。
- Taste：沿用亮色、纸色场景与同一角色，不增加装饰图或假 AE UI；真实缩略图、网格与控制器承担说明。参考既有模板的完整工作区和用户接管方式，保留根路由及原墙的22组常驻标题/用途，不启用候选页。
- Emil animate：新增用户触发的有限三阶段演示，0/1各停留1800ms后进入可拖拽阶段；暂停不改姿态，重播从分层视角开始。指针切阶段沿用200ms transform/opacity反馈，键盘切阶段即时。离屏、后台、reduced-motion与卸载均停止；恢复可见不会重播。没有改角色核心或添加动画库。
- 生命周期：按root幂等挂载，加载中多次切阶段保持最新选择；初次失败和运行期 `rig-error` 都可回退静态预览并重试。播放按钮的pointerdown/focus不会提前翻转播放状态，画布不可见时不能启动。
- 新 `scripts/test-duik-workflow.mjs` 纳入 `landing:test`，执行真实控制逻辑配合本地DOM/rig适配器。随后浏览器已恢复可用，真实点击确认关联阶段图层列表与控制阶段滑杆出现；发现旧 `.duik-workflow-scene` 样式将新舞台压成零高度，改为独立 `.duik-workflow-canvas` 并禁止画布 flex 收缩。26 项 workflow 回归含类名隔离，最终发布/测试/构建证据见下方同日批次。真实拖拽、完整演示中断、全页滚动仍未完成新验收；Nuxt 水合 mismatch 尚未定位。整页目标保持 active。

#### 图片墙标题与用途层级（2026-11-03）

- 本次范围仅处理用户要求的图下标题说明。22 组已有文字已在根首页实际读到；用途仍带 `text-white/60`，被全局亮色规则覆盖成标题色。发布器现在为 SSR/Vue 同步写入独立 `duik-wall-title` / `duik-wall-summary`，去掉旧颜色和强制单行类；标题 16px/600、用途 13px/400，图片下方 12px，组内 4px。保持原插画、几何、滚动、拖拽、链接、角色及文案。
- Impeccable 用于图下两层阅读关系；Emil 门槛在阅读文字上不新增动画，web-clone 契约限定原交互骨架不变。SkillDo 三项记录与实际 Codex symlink 已复核，无重新安装或全量更新。
- 完整发布：`output/landing-publish-wall-labels-2026-11-03.log`。墙/绑定定向测试 35/35；完整 `landing:test` 130 项（129 通过、0 失败、1 项可选 browser 跳过），见 `output/landing-tests-wall-labels-full-2026-11-03.log`。`npm run build` 退出码 0，见 `output/landing-build-wall-labels-2026-11-03.log`；构建期间停止同仓库 dev，随后恢复 3017。
- 浏览器 reload 后确认 22 组标题/用途，用途实际计算色为 `rgb(104,107,94)`，不再与标题同色；当前窗口观察到控制器、自动绑定、动画卡片的常驻下方文字。截图 `output/wall-captions-2026-11-03.jpg`。已清除上轮临时 viewport override；没有重跑多尺寸或整页验收，也没有本轮再次执行全部 22 条真实导航。
- `impeccable detect --scope layout` 返回空数组，`git diff --check` 通过；仅为源码检查。截图接口曾出现空白/合成不完整帧，现取得可见墙体截图，不据此宣称全页视觉完成。整页目标仍 active，未 commit/push/deploy。

### 安装记录（保留）

按 `skilldo-cli` 流程核对 SkillDo 记录和实际文件系统；只为两项缺失 Skill 安装已核验的子目录，再执行 `skilldo sync --skill <name> --tool codex --scope global --json`。不是只读取远程文档，也没有整仓批量安装、全量同步、全量更新或推送。

| SkillDo 名称 | 本次状态 | sourceRef | sourceSubpath | sourceRevision | Codex 可读入口 |
|---|---|---|---|---|---|
| `taste-skill`（内部名 `design-taste-frontend`） | 已有安装，保持原版本与内容，未 update / 重装 / sync | `https://github.com/Leonxlnx/taste-skill.git` | `skills/taste-skill` | `d237dd399d57524945c0c81327da5da19f7a468d` | `/Users/tanyancong/.codex/skills/taste-skill/SKILL.md` |
| `impeccable` | 本次补装并定向同步；Skill 版本 4.8.0 | `https://github.com/pbakaus/impeccable.git` | `.agents/skills/impeccable` | `f5c80432f883a0ee437735305eafc2a9e1bdb7a0` | `/Users/tanyancong/.codex/skills/impeccable/SKILL.md` |
| `animate`（Emil） | 本次补装并定向同步，含 `RECIPES.md` | `https://github.com/emilkowalski/skills.git` | `skills/animate` | `a81dbca07f2217b7103e510c0f13f8d5b017afc9` | `/Users/tanyancong/.codex/skills/animate/SKILL.md` |

- 三项 Codex 目标均已实测为 symlink，分别解析到 `/Users/tanyancong/.skillshub/taste-skill`、`/Users/tanyancong/.skillshub/impeccable`、`/Users/tanyancong/.skillshub/animate`；记录均为 `status: ok`，入口均可读。Impeccable 子目录含 63 个常规文件，Emil animate 含 2 个，未把同仓库其他 Skills 一起安装。
- Taste 安装前后 `SKILL.md` SHA-256 一致：`2136ed83016bfada39f7b8013b2aafd9f78fcbd9799110ed222a79c6419ba5fb`；整个中心目录树校验同样未变。远程新版本或临时下载的参考文本不替代这份受保护安装。
- 分工：Taste 用于整体构图、视觉节奏与避免模板化；Impeccable 用于页面层级、排版、颜色、内容精简和质量边界；Emil animate 用于有目的且可中断的反馈/解释动效、hover 门控与减弱动态。功能事实、原角色和已授权交互优先，不为套用 Skill 改写产品能力或任意替换现有动画系统。
- **安装完成 ≠ 已应用 ≠ 整页完成。** 安装阶段仅核对源码适用性、文件与链接；主集成须读取实际安装内容及相关参考，记录应用和页面结果。Impeccable 的 context launcher、可选下载 binary 与 hooks 未在本次安装阶段运行或启用；需要使用时按其说明与任务边界处理，不把安装成功当成工具运行验收。

### 0.2 整页推进顺序

| 阶段 | 交付目标 | 当前状态与边界 |
|---|---|---|
| S0 安装与读取 | 确认三项真实安装；读取已安装版本并选择职责 | 三项均已应用；Impeccable 检测本轮6个UI文件返回空问题数组，非视觉验收 |
| S1 功能入口墙 | 原首页22槽动态功能插画、常驻下方模块/用途、可达文档链接 | 新版已发布；12组定向桌面检查通过。2026-11-02 补核入口标题、用途、链接测试 9/9，根路由 HTTP 200；旧铺满截图版10组结果仅作历史 |
| S2 五段整页叙事 | 角色绑定、动画节奏、日常工具、资产复用、进阶 API / 学习；重做沉浸式场景并删减首层文本 | 新版已发布并完成2026-11-04内容审计与桌面走查；不另起候选页，不把库/API捏造成主面板 |
| S3 同路由整合 | 导航、Hero、各区过渡、CTA、FAQ、Footer 与 Nextra 入口一致 | 33点自然滚动覆盖首尾/跨区，真实完成页脚→中文安装文档→根首页；保留角色和译文边界 |
| S4 本轮验收 | 针对本轮实际产物记录加载、链接、交互和构建结果 | 本轮桌面范围完成，最后补丁52/52与137页构建；功能输入和分区证据分批记录。系统级reduce按用户选择未测，手机/AE/全站离线不外推 |

### 0.3 第一阶段：原首页 22 槽功能模块入口

从 Hero 往下滚到原有 22 槽墙。每个槽位变成 Duik 功能模块的文档入口；此阶段优先可见落地，但不再限制后续整页推进。

- **入口内容**：封面为 Duik 功能主题的原创动态插画，下方常驻模块名和一句用途，链接对应本地 `/docs/...` route。真实截图留在详情与文档；22 槽是精选功能入口，不改写官方八主面板，不生成假 AE / Duik UI。
- **保留与改变**：保留原布局、滚动错位/缩放、GSAP 时序和拖拽；普通点击直接进入本地文档，不再点击选中或展开图片。拖拽与点击必须区分，发生拖拽后的释放不能误触导航；键盘激活仍应进入对应文档。
- **已确定根因**：baseline payload filename 已是旧本地 SVG，SSR 仍残留 Linearity `hero1..22.jpg`，只按 payload 字符串替换漏掉 SSR。仍需按 DOM 槽位修正，不因新增链接而放过旧图恢复。
- **统一数据**：`components/home/landing/hero-wall-scenes.mjs` 的同一 `heroWallScenes` 管理 22 项封面、中文标题、用途说明和本地文档目标；`scripts/lib/landing-hero-wall.mjs` 按 DOM 槽位同步 SSR / payload / 入口链接，不再以图片弹层为当前交付目标。
- **范围保护**：原角色、26 层与绑定核心、Nextra 内容和工作台不改。先落实这 22 个入口，再依 §0.2 继续整页五段场景；不把范围扩大到 AE 实机、文档翻译或替换角色。

| 当前步骤 | 本批最小交付 | 当前状态 |
|---|---|---|
| W0 定位旧图残留 | 分清 baseline SSR 与 payload 来源 | 根因已确定；保留诊断记录 |
| W1 统一 22 个入口 | 同源封面 / 短中文标题与用途 / 本地文档目标，SSR 与客户端一致 | 已发布；常驻标题与用途逐项匹配，角色未变 |
| W2 原首页验证 | 点击/键盘到正确文档；拖拽释放不导航；滚动错位/缩放保留；不再选中或展开图片 | 12组定向桌面检查通过；2026-11-02 `node --test scripts/test-duik-hero-wall.mjs` 9/9，`http://127.0.0.1:3017/` 返回 200 且含22个标题说明节点；本轮未重跑全量 build 或视觉截图，不外推全页/手机 |

**被替代的阶段决策**：此前“只换素材、保留点击选中/图片展开，并同步弹层”的方案已被最新的“功能入口直达文档”决策替代；相关诊断与记录留作历史，不再指导当前点击行为。此前生图 API 返回 **403 `Country/region not supported`**，未产出新图，不是凭据未找到。

**误选范围记录**：`/landing-candidate.html` 与 `npm run landing:candidate` 是此前误选的独立候选路线，用户已叫停。候选有 9 项常规桌面检查，但 reduced-motion 问题尚未关闭；不作为完成交付，不引导预览，也不继续以候选验证代替原首页工作。相关文件/记录保留，不在本任务删除。

后文既有实现及验收仍是根首页历史基线；真实安装记录与最新分期以本节为准。体验方案中的官方分类、事实与素材依据继续适用；其中旧“仅媒体墙”的阶段限制已由本节最新授权替代。

## 已运行根首页的授权范围与基线（2026-11-01）

- 用已经独立实现的 `<character-rig>` 替换 Hero 原提示词输入组件；控制器默认显示，支持拖拽与 hover，不重画或替换已确认角色。
- 继续将既有落地页改为 Duik 中文指南：优先展示真实官方面板、AE 内的选择对象与操作步骤，再提供文档入口。沿用本地模板壳和非冲突动效；已将绑定区的超长滚动段改为正常阅读与三阶段切换，不再承诺原布局/时序完全不动。
- **整页采用亮色主题**，不是仅将 Hero 改白；当前主题真源使用暖纸色 `#f8f6f0`、卡片色 `#fffdf8`、墨色 `#272920` 和强调色 `#c4512e`。
- 允许多个 agent 按不重叠文件职责并行推进，最终由同一集成负责人发布并记录验收。以下状态只记录可核对的工作，不把历史组件验收算作新首页验收。
- 本轮实际落点：Hero 六预览使用官方 PNG；新增 `#inside-ae` 解释工具运行环境；`#workflow` 用骨骼、约束、控制器官方面板串起三阶段；Tools 四类、横向动画/自动化/摄像机、三类复用库、八面板/33 入口、五条学习路径/16 个入口、FAQ 和 Footer 均按官方素材与事实重编排。
- **验收边界**：23 张官方 PNG 是固定上游文档截图，不是本次 AE 实机录屏，也不保证对应当前软件 UI；可能保留旧版本号或英文。网页角色、几何、曲线与视差均为辅助示意，不是 Duik 官方算法或 AE 求解器。手机与 AE 未验收。

## 推进规则

1. 逐板块管理目标、文案、素材、动效、链接与验收状态；本轮授权足以开始实施，不重复等待已经给出的确认。未确认的新增角色、隐藏部位补绘和动作范围扩张不夹带进入。
2. 只修改当前板块及直接依赖，保留原角色与仍适用的模板动效。绑定区正常阅读/阶段切换、官方面板优先及相应布局调整属于本轮已授权实现；不把旧 700vh/7000px sticky 作为继续保留的要求。并行任务按文件分工，不同时覆盖发布产物。
3. 桌面是本轮交付重点。先形成可见实现，再做必要的加载、交互、链接和构建验证；不以反复多尺寸截图拖延修改。未实际验证的移动端等项目如实保留待办。
4. 当前 `/` 仍由 `next.config.mjs` 重写到 `public/landing.html`，沿用**本地 Nuxt 动画壳**。由其 Vue 组件提供空槽位，再挂载独立 Web Component；不让两个框架争夺同一段 DOM。
5. 本阶段不强制重写为 React，也不切换根路由。该执行决定替代本文早期“先重建 React、最后切根路由”的安排，不改变项目锁定的 Next.js App Router + Nextra 文档技术栈。
6. 每块分别记录源码实现与宿主验收。最终仍须运行 `npm run build` 并完成实际页面验证；不能凭静态截图、构建成功或旧报告宣称整页完成。

以下表格保留官方截图优先版基线状态，不是 §0 新一轮五段编排的完成清单；本轮推进状态以 §0.2 为准。

| 顺序 | 板块 | 基线状态 | 确认记录 | 实现/验收记录 |
|---|---|---|---|---|
| 0 | 基线与验收样本 | 固定基线已归入源码；旧验收归档 | 保留已有本地还原版本 | `baseline/` 为发布输入；`output/landing-before-light/` 仅作恢复；新版证据见 §5.3 |
| 1 | 顶部导航与 Hero | 中文定位、六官方 PNG 预览已发布；定向桌面宿主通过 | 原角色、可见控制器、亮色不变 | `hero-slot.mjs`、`adapter.js`、`content.mjs`、`theme.css`、`preview-scenes.mjs` |
| 2 | 认识 Duik 与绑定流程 | 官方面板、AE 操作模型和三阶段选择已发布 | 正常阅读取代旧超长 sticky | `orientation.mjs` / CSS；`#inside-ae` 与 `#workflow` 共用 workflow kind |
| 3 | 通用工具 | 四类官方面板、步骤及折叠 Web 示例已发布 | 合成 / 图层 / 文本 / 脚本 | `tools-demo.mjs` / model / CSS；旧 7 组独立结果仅作历史，新版桌面宿主通过，范围见本轮报告 |
| 4 | 动画、自动化、摄像机与复用 | 默认官方参考，可切 Web 示例；三库截图/步骤/放大已发布 | 三类 motion 分开，库保留官方层级 | `motion-demo.mjs`、`reuse-demo.mjs`；新版桌面宿主通过，范围见本轮报告 |
| 5 | 工具总览与学习路径 | 八面板/33 入口/面板图；五路径/16 阅读入口已发布 | 安装 / 绑定 / 动画 / 工具 / API | `experience-catalog.mjs`、`tool-catalog.mjs`、`guide-experience.mjs` |
| 6 | FAQ | 11 问、3 组，筛选/收起与原生 details 已发布 | 本地事实依据与非官方边界 | `guide-experience.mjs`；分类与展开/收起通过；完整辅助技术覆盖未验收 |
| 7 | 脚本 API | 三调用 + 官方脚本编辑器图 + 初始化/运行前提已发布 | 手臂 / 抖动 / 自动父子关联 | `experience-catalog.mjs`；只复制，不执行 AE |
| 8 | Footer、归属与元数据 | 新学习闭环、软件/文档许可区分和官方获取已发布 | 非官方、RxLaboratory、GPLv3/GFDL 1.3 | Footer 真源 `guide-experience.mjs`；元数据与营销清理沿用发布链，新版桌面宿主通过，范围见本轮报告 |
| 9 | 同路由整合与整页验收 | 10 个共享体验 kind、20 个模块/CSS 文件已发布；本轮定向桌面与构建通过 | `/` 本地 Nuxt 壳、`/docs` Nextra 不变 | 60 项总计、59 通过、1 项可选 browser 跳过；新版 19 组定向桌面通过，完整报告见 §5.3 |

**每块的完成定义**：决策已记录；素材本地化且来源明确；文案与视觉一致；链接真实可达；交互无空状态；桌面可读；键盘与减弱动态效果有实际结果；没有新增浏览器错误。手机未验收时单独标记，不宣称全端完成。仅有构建通过或截图相似不算完成。

每次讨论结束后，在对应板块下按同一格式记录：

```text
确认日期与结论：
目标 / 文案 / 素材 / 动效 / 链接 / 移动端：
需制作的文件及来源：
预览地址与验收证据：
遗留问题：
```

## 1. 页面身份与目标

- **本站身份**：Duik Ángela 的非官方中文文档与使用入口。Duik 软件由 RxLaboratory 开发；本站不提供软件镜像，也不代表官方。
- **核心读者**：已使用 After Effects 的动画师、绑定师及需要整理图层、处理合成/文本或扩展脚本工作流的创作者。文案按完整专业工具集写，不承诺新手一键完成角色动画。
- **首要动作**：进入中文文档，从安装或绑定流程开始阅读。次要动作是前往官方渠道获取 Duik。
- **本轮叙事主线**：Hero 体验角色与功能入口 → 角色绑定 → 动画节奏 → 日常工具 → 资产复用 → 进阶 API / 学习，再由 FAQ、归属与官方获取完成闭环。官方八面板与更细步骤保留在次级导航、按需展开或文档，避免把落地页写成连续操作教程。官方面板仍是功能证据，不把 Duik 缩成角色绑定，也不沿用“输入提示词生成素材”的叙事。
- **视觉气质**：全落地页采用暖白/浅纸色、深色正文、细边框和可读的官方界面图；保留适用的横向过渡，绑定流程改为正常阅读。暖橙强调状态，角色控制器保留红/蓝/紫/洋红/绿语义。Nextra 正文和文档主题不在本次修改范围。

## 2. 板块方向与当前实施边界

下表记录官方截图优先版基线，供本轮五段编排继承真实功能、素材与已授权交互；新顺序和状态以 §0 为准。实现/发布与真实宿主验收分开，基线证据见 §5.3；旧情境选择器、双角色对比、原创六 SVG 预览和长滚动绑定分镜均不是当前呈现契约。

| 2026-11-01历史基线 | 当时区块与文案 | 当时画面素材 | 当时交互与去向 |
|---|---|---|---|
| 导航与 Hero | `认识 Duik / 角色绑定 / 通用工具 / 工具总览 / 脚本 API / 安装指南`；主标题 `从角色绑定，到日常创作。`；说明明确 AE 脚本工具集及本站非官方中文指南身份 | 已确认角色与 26 层不变，周边六预览使用本地官方 PNG | 控制器默认显示，拖拽、hover、复位和显隐保留；锚点 `#inside-ae / #workflow / #tools / #toolkit / #api`，安装/文档交给 Nextra |
| 认识 Duik + 绑定流程 | 先说明“选中图层/属性/关键帧 → 调用工具 → 留在 AE 编辑”；三阶段为准备骨架、关联与绑定、控制与动画 | `duik/individual-panels.png` 只代表独立面板用法；三阶段为 bones / constraints / controllers 官方图 | 正常阅读及手动阶段切换，不再依赖 700vh/7000px sticky；说明骨骼是 AE 形状图层，预设可作起点；Link Art 位于骨骼工具栏 |
| `#tools` | `不做角色绑定时，Duik 也用得上。`；合成、图层、文本、脚本四类 | 四张官方工具面板与 rename / script-editor 细节图，配准备/操作/结果 | 先读官方操作，再按需展开 Web 示例：蒙版边界裁剪、26 PNG 层显隐、文本应用/撤销、代码编辑/复制；不操作 AE |
| 横向动画 / 自动化 / 摄像机 | 默认展示官方参考与 AE 内步骤，可切换原理示意 | temporal-interpolation、wiggle-effect、camera-panel 与 2d-camera-effect；示意用原创 SVG | 插值对应已选关键帧；抖动对应已选属性/效果参数；网页曲线/信号/视差不是官方算法或默认值 |
| `#reuse` | `做好的东西，下次继续用。`；OCO / 动画 / 脚本三库 | 三张真实库面板图、每库步骤及笔记/自检文档入口 | 标签切换、实际图片放大/2x 与文档导航；没有 OCO/duio 读写、保存应用或工程扫描 |
| `#toolkit` + 学习路径 | 八个官方主面板、33 个精选入口；安装 / 绑定 / 动画 / 工具 / API 五路径共 16 阅读入口 | 八官方 SVG、当前选中面板截图、官方 home 图与原创阅读路径插画 | 中英文搜索、分类、键盘文档导航；原创插画不是 AE UI，33 入口不是全部命令枚举 |
| FAQ | 11 问、3 组，解释安装、工具与网页边界、获取和本站身份 | 以准确文字为主 | 分组筛选、原生 details、收起与真实文档链接；不硬编码兼容承诺 |
| `#api` | `把常用操作，接进你的工作流。`；手臂绑定 / 抖动 / 自动父子关联 | 真实三调用、官方脚本编辑器图、所选对象与初始化/运行前提 | 切换和复制成功/失败反馈；需 AE ExtendScript、正确引入 API、`DuAEF.init()`；无 `DuScriptUI.showUI()` 时还需 `DuAEF.enterRunTime()` |
| Footer | `下一帧，回到你的创作。`；中文学习入口与官方获取 | 非官方、RxLaboratory、软件 GPLv3 与文档 GFDL 1.3 分开说明 | 文档/上游/许可入口保留，不提供安装包镜像，不声称官方站 |

最终页面的导航与页脚不应出现原站的 `Pricing`、`Log in`、`Get started`、Linearity 产品、营销团队或品牌承诺。页面的标题、favicon、OG 图、结构化数据在板块 8 一并处理。

### 板块 0：固定基线

- [x] 将不可丢失的发布输入收纳到 `components/home/landing/baseline/`；原 `output/landing-before-light/` 保留作恢复副本。
- [x] 已有独立工作台 `/rig-test.html` 和组件演示 `/rig-embed.html`；两者继续保留。本轮预览仍是原首页 `/`，首阶段查看 Hero 下方媒体墙，随后逐区整合；误选候选页已暂停。
- [x] 基线、历次修改与可用证据已分别归档于固定baseline和§0/§5.3；没有记录的多端状态不追认通过。
- [x] `3017` 根路由服务duik-zh本地发布结果，`/docs/*`仍由Nextra承担；路由与服务记录见§0。
- [x] 54个独立文档目标有本地MDX，官方媒体/图标的固定来源与归属清单已核对；这不等同全站文档资源离线验收。

### 板块 1：顶部导航与 Hero

- **当前实现**：中文导航与 Hero 文案已进入真源；Vue 空槽位挂载 `<character-rig src="/riglab-project/rig.json" interaction="both" controls="visible">`；宿主提供复位和控制器显示切换。
- **锁定素材**：`public/duik-character/source/character-selected-v1.png` 与既有 26 层；身份哈希、限幅及真实限制见角色文档。
- **验收点**：首页真实加载组件，不是整张图冒充绑定；初始控制器可见、能拖拽和复位；hover 不破坏拖拽；加载失败有本地静态回退；卸载无残留资源；CTA 可达 Nextra。
- **状态**：组件拖拽、键盘、复位、显隐、hover 的旧宿主结果保留为历史；本轮六官方 PNG、定位文案和导航变化后的Hero 拖拽/复位和工具导航已通过新版宿主回归。

### 板块 2：认识 Duik 与绑定流程

- **当前实现**：`orientation.mjs` 提供 `#inside-ae` 的 AE 操作模型和 `#workflow` 的26层准备、骨骼关联、控制接管三阶段。角色占据完整舞台，短说明与阶段选择在下方；官方bones/constraints/controllers图片和步骤按需展开。
- **内容约束**：骨骼为 AE 形状图层，可从预设出发；“链接图形（Link Art）”位于骨骼工具栏。阶段旁的约束面板不是 Link Art 所在位置；不演示上传图片自动拆层/识别。
- **当前布局/验收点**：26层展开、归位、关联镜头、部位/关联层响应与控制接管已实现，保留正常流。2026-11-04最终绑定版已实际验证完整演示、手部拖拽、已保存姿态重播、离屏取消与返回不重播，范围及限制见§0；不以独立Hero或单元测试替代这些证据。

### 板块 3：通用工具体验（取代旧对比区）

- **历史实现**：`pose-slot.mjs` 曾在对比区挂载第二个角色实例；保留源码与历史记录，不再把它当当前工具区。
- **当前实现**：四类共享开放双画幅、等尺度与参考点，以有限播放头展示裁剪、预设图层名称/标记整理、文本替换、脚本片段取用；外围曲线只跟随真实滚动。首层是短说明与可操作原理示意，官方界面、步骤和更完整工具例放入默认关闭的详情。
- **辅助示例**：图层例用真实 26 张 PNG 的选择/隐藏/筛选；裁剪为可逆网页几何；文本应用/撤销不会更新 AE 表达式引用；代码只编辑/复制，不执行。
- **状态**：上一版独立 tools 7 组通过及参考点 x=0、y=0 是保留的回归基线，不证明本次官方面板与折叠入口已通过新宿主。本次官方面板、折叠入口与真实操作通过新版宿主检查。
- **验收点**：切类时面板、步骤与文档同步；折叠示例可用且无假执行提示；图层例与 Hero 状态隔离，展开/卸载不留下资源。

### 板块 4：能力卡与阶段总览

- **当前实现**：横向前三场景分别以插值路径、属性抖动、分层摄像机解释能力，保留有限预览、手动进度及用户接管；官方图和步骤按需展开。随后接回原Linearity图片环绕、汇聚、五项轮选与离场；`reuse-demo.mjs`的OCO/动画/脚本库工作台位于圆环二级详情。
- **边界**：网页曲线不是 Duik Bézier 编辑器，确定性信号不是 Duik 随机/表达式算法，视差因子不是官方默认值；三库不提供真实文件存取或项目扫描。
- **历史滚动修正**：上一版曾收敛无消费者 hold；父级 gap `clamp(96px,12vw,220px)`、距离因子 `1.6 → 1.1`、hold 约 `0.3 viewport`。当时 1440×1000 测得横向段 13786→9178px，约减少 33%；此记录不是新版验收。当前面板、示意切换及三库放大通过新版横向宿主检查。
- **验收点**：完整画幅、原父级轨道、键盘交接及可操作暂停；原圆环与五文档入口同步。当前分段画面/交互见§0，手机与真实系统减少动态效果切换不在已验收范围。

### 板块 5：工具总览与学习路径

- **当前实现**：`#toolkit`直接呈现搜索、八官方图标分类和33精选入口；截图在关闭详情。`guide-experience.mjs`用五任务导航、一个当前主入口及后续路线承接，共16个阅读入口。两区不重复图片墙封面；旧学习卡不再是当前真源。
- **状态/边界**：当前源码已发布，guide 独立测试 10/10 通过；新版桌面宿主通过，范围见本轮报告。目录只打开文档，不执行 AE 命令；33 入口不是完整功能枚举，路径插画不是 AE UI。
- **验收点**：分类/搜索/键盘与图片同步；安装说明为 `Duik Angela.jsx` → `File / Scripts / Install ScriptUI Panel…` → 重启 → Window；每个阅读入口可达。

### 板块 6：FAQ

- **当前实现**：`guide-experience.mjs` 提供 11 问、3 分组、筛选与收起，使用原生 `details`；覆盖定位、安装、能力/网页边界、获取、归属和兼容要求，不再沿用旧 `content.mjs` FAQ 作为当前真源。
- **验收点**：分组、展开/收起、键盘和内链正常；不硬编码版本兼容承诺。guide 源码测试通过，新版分类、展开/收起及文档跳转通过定向宿主检查。

### 板块 7：脚本 API（取代旧情境入口）

- **历史实现**：原页底曾提供骨骼/约束/动画情境选择；历史 tabs 测试不适用于当前 API。
- **当前实现**：`#api`由`api-cinema.mjs`提供SSR/运行时，三示例在同一关系舞台内呈现“对象→真实调用→结果”；4200ms有限播放和手动进度保留，首层不重复代码。官方图、复制与运行前提进入默认关闭详情。
- **运行前提与验收点**：AE ExtendScript、正确引入对应版本 API、`DuAEF.init()`；不用 `DuScriptUI.showUI()` 时，在调用功能前 `DuAEF.enterRunTime()`；选择所需骨骼/属性/图层。只复制片段，复制成功/失败可见，不保证拼成完整脚本即运行。新版桌面宿主通过，范围见本轮报告。

### 板块 8：Footer、归属与元数据

- **当前实现**：`guide-experience.mjs` 的“下一帧，回到你的创作。”承接学习入口；非官方声明、RxLaboratory、软件 GPLv3 与文档 GFDL 1.3、官方获取/不设镜像明确分开。发布同步 SSR/Nuxt 元数据，营销分析/聊天清理沿用既有链路。
- **本轮资源/亮色收尾**：首页 favicon 与 manifest 使用本地官方 `controller.svg`，来源见 `icons/sources.json`；巨大绿色背景曲线改为浅鼠尾草色，scroll cue 移除浅色页面上影响可读性的白色渐变。
- **仍需核对**：实际 DOM 和请求中的 favicon、OG、结构化数据、旧品牌/价格/登录入口、营销图及远端请求；源码清理不等于浏览器零残留。
- **验收点**：Duik 软件与本站译文的归属清楚；官方外链明确；页面元数据不再含 Linearity。

### 板块 9：同路由整合与整页验收

- [x] 本轮19组定向桌面宿主检查通过并保留报告；不将未覆盖项自动算作通过。
- [x] 保留当前 `/` 重写与本地动画壳；2026-11-04新增33点自然滚动检查首尾/跨区，结合已完成锚点与键盘检查，真实完成首页↔安装文档往返。见§0最终报告，不宣称逐帧录像。
- [x] 页面亮色、Hero拖拽/复位、水合与资源检查通过；官方 AE 截图保留原有深色，不重着色。
- [x] 记录首页本地资源、桌面交互/键盘和137页构建结果；整站断网、新版全局 reduced-motion 与手机未实测，不宣称通过。
- [x] 已记录正常阅读替代长 sticky、官方参考优先等布局例外；保留独立工作台与角色组件。

## 3. 素材生产清单

1. **角色母版**：沿用已确认的透明 2D 上半身角色及 26 层，覆盖胸腰、颈面、耳发、双臂手和五官。保留身份哈希，不追加腿部、不另画角色。
2. **历史角色分镜**：同源静止/拆层/骨骼/IK/有限姿势仍可保留作归档或回退，不再作为当前 Hero 六预览或绑定流程的主画面；不新增全身动作。
3. **官方界面证据**：本轮使用 23 张固定官方文档 PNG，真源 `components/home/landing/official-media/`，发布 `/duik-experience/official/`，来源与 SHA-256 见 `sources.json`。固定 SHA 为 `718e6e282d1ae91dc9678bb1a202ce08e862a28d`，文件存在及哈希已核对。截图保留原字节，可能含英文/旧版本号，不是本次 AE 实机证明；23 张归档不等于全部在首页展示。
4. **图标与辅助插画**：八官方 SVG 的来源/校验另见 `icons/sources.json`。Hero 六预览现指向官方 PNG；`preview-scenes.mjs` 中旧六原创 SVG 仅是历史资产，不继续列为当前主预览。学习路径的原创 SVG 清楚标作阅读插画，不冒充 AE 界面。
5. **响应式资源**：当前以桌面为交付重点，官方图保留比例和可读性、需要时放大；手机裁切/安全区和触控仍未验收。动态区域应有静态说明与本地回退。
6. **许可与归属**：官方截图署名 Nicolas “Duduf” Dufresne / RxLaboratory and contributors，保留文档 GFDL 1.3 语境与来源清单，不改标 MIT/CC0。未来真实 AE 录屏需另记软件版本、操作与素材许可；未导入的其他文档媒体不算首页资产。

## 4. 动效规则

- 动效承担解释或导航作用；官方截图和 AE 操作步骤是主证据，Web 示例只帮助理解，不模拟“已在 AE 成功执行”。
- 保留仍适用的本地模板动效；绑定区已明确移除旧超长 sticky，改为普通阅读和阶段切换。横向 motion/复用区仍用本地壳，既有 hold 收敛属于历史修正，不能据此承诺新版滚动已验收。
- 每个实际交互要有真实状态：阶段/标签切换、官方参考/网页示例切换、图片放大、FAQ、搜索、复制及导航。焦点、键盘和 reduced-motion 的新版结果由宿主验证记录；没有操作的官方图不伪造可点击控件。
- 亮色主题必须覆盖所有落地页区块和状态，不通过全页反色滤镜篡改角色颜色。避免长时间空框；图片、视频、脚本加载失败时显示本地静态图和标题。

## 5. 实现边界

### 5.1 根首页基线路由与三层职责

当前 `/` 通过 `next.config.mjs` 重写到复制的 `public/landing.html`，再由本地 Nuxt 脚本接管。`app/page.tsx` 不是当前实际根页面。**本阶段保留这条已还原的运行路线**，不强行迁移 React，不删必要 Nuxt 分包。Nextra 文档和 App Router 不换栈，不改 `content/docs/**` 和 `upstream/`。

1. **工作台**：`rig-test.html` 负责拆层、对齐、姿态制作和验证，不整页嵌入 Hero。
2. **可移植角色组件**：`character-rig.js` 与 `character-rig-core.js` 负责唯一一套蒙皮、IK、控制器和生命周期；图层、身份哈希与动作限幅不由 Hero 重新定义。
3. **Hero 宿主**：`hero-slot.mjs` 提供 Vue 持有的空节点；`adapter.js` 挂载组件、标题、提示和辅助按钮，并在卸载时清理。不是 iframe，也不是第二套绑定引擎。

`/docs` 链接走普通浏览器导航交给 Nextra，不能交给复制的 Nuxt 路由器。亮色样式仅限定落地页，不改变 Nextra 正文或文档主题。首页外链保留官方身份标记；发布已移除原营销分析/聊天接入，保留渲染、路由与必要初始化配置，实际请求结果另行验收。

### 5.2 真源、发布与回退

- `content.mjs`：Hero 中文文案槽位与导航；旧学习卡/FAQ/Footer 导出保留为历史，不代表当前布局使用。
- `theme.css`：亮色主题与 Hero 宿主样式。
- `hero-slot.mjs`、`adapter.js`：Hero 角色宿主、导航与全页接入；`learning-slot.mjs` / `pose-slot.mjs` 为早期记录。
- `scenes.mjs`、`visual-*.mjs`、`visual-scenes.css`：同角色历史资产/中间发布层；当前 Hero 六预览由 `preview-scenes.mjs` 的官方 PNG 映射提供，旧原创向量不是当前展示。
- `experience-layout.mjs`：Node SSR 与 Vue 共用结构；`experience-vue.mjs` 接本地 Vue，`experience-mount.mjs` 分派挂载/清理，`experience-shell.css` 管区域壳；共 10 个 kind：workflow、tools、catalog、api、faq、footer、libraries、animation、automation、camera。
- `orientation.mjs` / CSS：26层绑定舞台与三阶段交接；`tools-demo.mjs` / model / CSS：四类开放双画幅；`motion-demo.mjs` / model / CSS：三类动态原理舞台。官方图与步骤在详情。
- `orbit-vue.mjs`：原圆环父子进度桥接；`reuse-demo.mjs` / CSS：二级三库工作台；`guide-experience.mjs` / CSS：五学习路径、FAQ、Footer；`experience-catalog.mjs` / CSS 与 `tool-catalog.mjs`：八面板检索、33入口与能力真源；`api-cinema.mjs` / CSS：三调用关系舞台。
- `official-media/`：23 张固定官方 PNG 与来源/哈希；`icons/`：八官方 SVG 的独立清单。
- **固定发布输入**：`components/home/landing/baseline/`。它不是运行目录，不能在其中继续替换文案；保留模板来源与许可。以后提交首页时必须包含该目录，不得把发布必要文件只放在被忽略的 `output/`。
- 发布统一使用 `npm run landing:publish`：`publish-duik-landing.mjs` → `patch-duik-landing-visuals.mjs` → `publish-duik-experience.mjs`。最后一步当前发布30个模块/CSS文件，另复制官方PNG、图标及来源清单，并同步10个SSR/客户端kind（workflow含认识/流程，catalog含学习）。只跑前两步会留下中间旧槽位，不能称完整发布。产物由现有Next服务读取。
- 数据策略：按字段类型更新序列化引用，新增字符串通过索引复用/追加；共享空字符串 `payload[15]` 保持为空，不能用图片路径替换。SSR 只对匹配文字节点做精确映射，同步内联 `__NUXT_DATA__` 和客户端元数据，保留必要的 `window.__NUXT__`。
- 本地图片路由 `app/.netlify/images/route.ts` 支持获准静态目录内的真实 WebP/PNG/JPEG/SVG；不依赖在线图片镜像，仍需验证 MIME 和请求结果。
- 恢复副本 `output/landing-before-light/` 保留，但不再是主发布器唯一输入。回退只针对本轮涉及文件，不覆盖用户其他脏工作。
- 原 `duik-preview.css/js` 不再是本轮主题真源。排错和改文案先改 `components/home/landing/`，再运行发布，避免运行产物与源码分叉。

仓库根目录命令：

```bash
npm run landing:publish
npm run landing:test
CATALOG_BROWSER_TEST=1 node --test scripts/test-duik-catalog.mjs
npm run dev -- --hostname 127.0.0.1 --port 3017
```

服务在独立终端运行后执行：

```bash
npm run landing:verify
npm run build
```

`landing:test` 检查发布契约和模块；**当前 `npm run landing:verify` 已直接执行 `node scripts/validate-duik-experience.mjs`**，不是早期宿主脚本，默认报告 `output/duik-experience-check/report.json`，`--inspect` 写入 `inspect/` 且仅用于诊断。它按 `rootHome`、`docsNavigation`、`docsResources` 区分首页、文档导航与文档媒体，不把文档既有外联/404藏掉，也不冒称全站离线。可用 `LANDING_URL` / `CHROME_BIN` 指定本轮入口/浏览器；命令存在不等于通过。

### 5.3 验收证据归属

当前 `npm run landing:verify` 默认报告为 `output/duik-experience-check/report.json`，`--inspect` 仅作诊断。早期 `output/duik-landing-validation/report.json`、视觉补丁 `--verify` 的 `output/duik-visual-validation/` 以及旧 `LANDING_INSPECT=1` 结果均归历史，不混作当前入口或新版验收。

#### 历史技术基线（2026-11-01，本轮任务模块接入前）

保留下面的原始结果和失败边界，不能外推为新工具、motion、检索或 API 的整页验收：

- `npm run landing:test`：11/11；验证序列化图、SSR/客户端数据、Nuxt 必要配置、两个输入槽位替换、初始旋转词、同源发布与真实文档路径。
- `node --test scripts/test-character-rig.mjs`：8/8；原图 SHA-256 仍为 `fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a`。
- `output/duik-landing-independent/hydration/report.json`：`hydration=[]`，console/失败请求/外网请求均为空；通过。此前 22 处 SSR 子视觉差异与 Hero 初始文字差异已修正。
- `output/duik-visual-validation/report.json`：原三阶段滚动、三个横向场景与两组真实 hover 通过；无浏览器异常/失败资源，旧流程 Lottie 不再请求。截图证明实际可见，不以 DOM 存在代替。
- `output/duik-landing-independent/host/report.json`：Hero 拖拽、头/腰键盘操作、复位、显隐、hover、旋转词、FAQ、情境 tabs 与 10 条文档 HTTP 200 已通过；整份报告的最终导航结论以专项记录为准，不掩盖失败。
- `output/duik-landing-independent/cta-scroll/report.json`：已证实旧测试失败是点击了仍在屏幕外的导航（中心 y=-39），不是路由故障。使用宿主 `window.lenis.scrollTo(0,{immediate:true,force:true})` 并等待坐标稳定后，真实命中 A 标签并进入 `/docs`，无 console 错误/失败请求。该报告仍为 `passed=false`，因为进入文档后加载了 4 个既有 CC 许可证图标外链；不把这个全局离线断言改成通过。
- `npm run build`：2026-11-01 通过，生成 137 页；完整日志 `output/duik-landing-build.log`。随后恢复 duik-zh 的 `127.0.0.1:3017` 本地 Next 预览。父目录多 lockfile 的既有 workspace-root 警告保留，未修改无关工作区。
- 遗留：文档页一次新鲜加载出现 `/favicon.ico` 404；原模板跨断点 reload 曾产生 GSAP 空目标警告。首页自己的诊断无外网请求，但进入文档后并非完全离线。新版 host 测试修正了 Lenis 回顶和命中检查，仅做语法检查，未重跑整套报告；不宣称全站/全尺寸验收完成。

这些结果仅证明最早技术基线，不能用于之后的任何改版。上一版 Web 演示优先与本轮官方截图优先的证据继续分别记录。

`output/rig-validation/report.json`、`output/rig-embed-validation/report.json`、`output/rig-export-validation/report.json` 和 `output/rig-installed-component-validation/report.json` 只证明其各自的历史工作台/组件范围，不证明新 Hero 或整页完成。

#### 上一版体验基线：模块与独立验证（2026-11-01，官方截图优先改版前）

- 主线程记录：`npm run landing:test` 运行 `test-duik-landing.mjs`、`test-duik-catalog.mjs`、`test-duik-motion.mjs`、`test-duik-tools.mjs`，**39 项合约/单元通过**；catalog 的独立浏览器项默认不包含在这 39 项中。
- `CATALOG_BROWSER_TEST=1 node --test scripts/test-duik-catalog.mjs`：**9/9**（8 项源码契约 + 1 项独立真实浏览器）。覆盖分类、搜索、方向键/Enter/Esc、幂等挂载与清理、复制成功/拒绝反馈；API 剪贴板成功/拒绝分支使用受控替身，不是 AE 执行证据。
- `output/duik-tools-check/report.json`：**7 组通过**；真实裁剪拖拽/键盘与复位、参考点 delta `{x:0,y:0}`、26 层真实显隐且保持姿态、文本应用/撤销、编辑草稿/复制与拒绝反馈、卸载和重挂；console/失败请求为空。
- `output/playwright/motion-browser-report.json`：**5 组通过**；时间/路径同步、属性参数与实例隔离、镜头拖拽/键盘/网格/景深、离屏休眠、明确播放后恢复、reduced-motion 停止和清理；错误、失败请求、外网请求为空。这是独立场景证据。
- **上一版内容**：Hero 六原创 SVG、四标签工具、横向三 motion + 仅导航的复用库、八面板/33 入口、三调用与八官方 SVG。此处仅归档当时交付，不描述当前主画面。
- 上一版首页诊断/宿主曾确认 hydration 0、外联 0、404 0；`rootHome`、`docsNavigation`、`docsResources` 分开统计。新版组件与图片替换后必须重新验证。

#### 上一版体验基线：整页验收（2026-11-01，非新版结论）

- **旧宿主范围通过**：实际 `3017 /`、1440×1000 的 15 组检查，包括 14 组首页及真实 Nextra 文档导航 HTTP 200；当时 `output/duik-experience-check/report.json` 为 `scopedPass=true`，首页 errors / failedRequests / externalRequests 均为空。同名报告会更新，不能凭旧描述判新版通过。
- **旧构建通过**：2026-11-01 `npm run build`，终端会话 77901、退出码 0、137/137 页；保留多 lockfile workspace-root 警告。随后以本地 dev 命令恢复 3017（会话 21835）。这不是本次官方截图改版后的构建。
- **旧遗留边界**：导航重复扣除 84px 源于 Lenis 已处理 `scrollMarginTop`，改为 `offset=margin-84` 后旧锚点验证通过。`docsResourcesPassed=false`：既有 `/favicon.ico` 404、官方 MP4 外联；历史 CC 外联和跨断点 GSAP 不因此关闭。不承诺全站离线。

#### 根首页官方截图优先版：已归档证据（不覆盖本次媒体墙，2026-11-01）

- **合约/单元**：主集成记录总计 **60 项，59 通过，1 项可选 browser 跳过**。跳过项不算通过，不与上一版 39 项或独立浏览器重复相加。guide 独立测试为 10/10，亦不另加进总数。
- **素材/文档**：23 张官方 PNG 文件及 SHA-256 与清单一致；逐区内容审读、48 个 MDX 路径和 4 个关联文档链接检查见 `LANDING_CONTENT_AUDIT.md`。这些是来源/静态证据，不是浏览器验收。
- **初次 inspect**：检测到 10 个共享体验模块，首页无错误；inspect 为诊断，不等于所有标签、放大、示例、键盘与导航已验收。
- **集成修复及复核：通过。** workflow 懒图曾使区块晚增高约 54.8px；补充固有尺寸并给 figure 预留 `min-height:475px` 后，冷启动首次工具导航落点为 83.703125px，满足 84±2px。Vue 滚动重写 class 曾使旧模板导航露出；改用 `header[data-duik-ready=true]` 后，实际滚动检查确认只显示 Duik 导航，旧 Logo / login 均隐藏。
- **新版桌面宿主：本轮范围通过。** 实际 `3017 /`、1440×1000 完成19组检查（18组首页 + 1组 Nextra 导航），`scopedPass=true`，首页错误、失败请求和外联均为0；23张资源均返回真实 PNG。Nextra 裁剪文档跳转 HTTP 200；文档区仍请求官方 MP4，因此 `docsResourcesPassed=false`，不声明全站离线。最终报告归档 `output/duik-experience-check/report-official-panels-2026-11-01.json`（会话20819、退出码0），与上一版证据分开。
- **新版构建：通过。** 主集成在本次官方截图版执行 `npm run build`，会话 75705 退出码 0、137/137 页；日志 `output/duik-landing-build-2026-11-01-official-panels.log`。随后已恢复 3017 本地 dev（会话 85547），最终定向宿主复核通过（见本节）。此结果与旧会话 77901 的构建分开，不代替浏览器验收。
- **手机/跨断点：未验收。AE 实机：未执行。** 网页示例、官方历史截图及 API 复制均不能证明当前 AE 行为、官方求解器或版本兼容性。

## 6. 内容与验收约束

- 文案依据 `content/docs/getting-started/introduction.mdx`、`content/docs/getting-started/install.mdx`、`content/docs/guide/**` 和 `docs/GLOSSARY.md`。没有证据的效率数字、用户评价、客户 Logo、价格和兼容承诺不得出现。
- 链接先用已存在的路由：`/docs`、`/docs/getting-started/install`、`/docs/getting-started/introduction`、`/docs/guide/bones`、`/docs/guide/bones/autorig`、`/docs/guide/constraints`、`/docs/guide/controllers`、`/docs/guide/animation`、`/docs/guide/automation`、`/docs/guide/camera`、`/docs/faq`。上线前逐一 HTTP 和浏览器验证。
- 首页主按钮、每张能力卡、FAQ 内链都要能到文档；文档区保留返回首页入口。软件获取指向官方页面 `https://rxlaboratory.org/tools/duik-angela/`。
- 页面底部显著保留非官方声明、上游归属与文档 GFDL 1.3 信息。首页原创营销文案与上游文档译文分别管理。
- 对照基线逐区检查构图、过渡、交互、响应式和资源请求。出现空框、破图、客户端文字恢复、滚动阶段错位或死链即视为未完成。

## 7. 根首页基线：实施结果与剩余范围

本节记录2026-11-01官方截图优先版历史基线，不是当前执行清单。其“P1未实现”及“截图/步骤优先”只描述当时，已由§0的绑定舞台、简短动态首层及实际交互证据替代。保留历史功能边界与官方层级，不据旧状态重建已完成模块。

执行依据为 [LANDING_EXPERIENCE_DESIGN.md](./LANDING_EXPERIENCE_DESIGN.md)，事实审读见 [LANDING_CONTENT_AUDIT.md](./LANDING_CONTENT_AUDIT.md)：

1. 保留本地 Nuxt 壳、Nextra、亮色、原角色/26 层及共用核心，不换栈、不重生角色。
2. 认识 Duik、正常阅读的三阶段绑定、Tools 四类、三 motion 官方参考、三库、目录/五路径、API、FAQ/Footer 构成当前叙事。旧六 WebP/六 SVG 不再重复担任所有能力主图。
3. 官方 PNG 的固定来源和 AE 内步骤为主证据；网页曲线、26 层、裁剪、文本/代码和视差为明确标注的辅助示例。P1 关节选择→关联层高亮仍单列，不能由三阶段官方面板说明替代。
4. 库、笔记、自检保持真实官方层级；API 片段与初始化/进入运行态前提同时展示，不假执行、不冒充完整脚本。
5. 已授权内容直接推进；新版构建已通过，19 组定向桌面宿主结果记录于 §5.3，历史 P2/P3 独立测试不能覆盖当前新入口、折叠状态和官方图片。

### 7.1 官方面板覆盖矩阵

官方核对日期为 2026-11-01；来源仅限 RxLaboratory/Duik 的 `src-docs/mkdocs.yml` 与 `src-docs/docs/**/*.md`。固定提交 `718e6e282d1ae91dc9678bb1a202ce08e862a28d`（2026-02-19 09:10:18 UTC）。[first-look 原文](https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/docs/getting-started/first-look.md#L56-L79) 明确顶栏八项；[mkdocs 导航](https://github.com/RxLaboratory/Duik/blob/718e6e282d1ae91dc9678bb1a202ce08e862a28d/src-docs/mkdocs.yml#L49-L179) 则含更多章节，两者不能等同计数。

| 官方面板 | 首页能力域 | 本轮结果 / 仍有边界 | 文档落点 |
|---|---|---|---|
| Bones | 绑定结构 | bones 官方面板与 AE 形状图层/预设说明；Link Art 在骨骼工具栏，P1 关节关联高亮未完成 | `/docs/guide/bones` |
| Links and constraints | 驱动关系 | constraints 官方面板与关联/绑定步骤；Hero IK 仅一类示意，不代表全部约束 | `/docs/guide/constraints` |
| Controllers | 控制与结构管理 | controllers 官方面板、Hero 控制器及辅助 26 PNG 层显隐；不创建或烘焙 AE 控制器 | `/docs/guide/controllers` |
| Automation & expressions | 程序化运动、属性与表达式 | Wiggle 效果原图/选中属性步骤优先；可选参数示意不是官方算法，引用比较仍未做 | `/docs/guide/automation` |
| Animation | 关键帧、插值、动画复用 | 时间插值官方图/选中关键帧步骤优先；可选曲线示意、动画库面板/步骤，不读写库文件 | `/docs/guide/animation` |
| Camera | 镜头与场景 | 摄像机与 2D effect 官方图/步骤；可选视差/网格不是官方默认值 | `/docs/guide/camera` |
| Tools | 合成 / 图层 / 文本 / 脚本与表达式 | 四类官方面板、步骤/文档 + 折叠 Web 示例；合成设置与蒙版裁剪分别说明 | `/docs/guide/tools` |
| Command Line and Feature Library | 发现工具 | 命令面板官方图 + 八面板/33 文档检索与键盘导航；不执行 shell 或 AE | `/docs/guide/cmd` |

“管理”是本站任务分组，**不是官方第九面板**；API 在 Advanced 下，另设开发入口。笔记、自检、OCO 元绑定库、动画库、脚本库按各自辅助/章节层级呈现，见体验方案 §3.3，不能删掉，也不能全升格成主面板。

### 7.2 根首页遗留与本轮整页改造的验收边界

- 当前按 §0 分期推进原根首页整页改造；22 位媒体墙为第一阶段，三项 Skills 已真实安装并保留来源记录。独立候选继续暂停；本节旧结果不能替代新墙或后续整页发布/交互结果。
- 本轮官方截图优先版构建与19组定向桌面宿主均通过，证据见 §5.3；手机、跨断点、全局 reduced-motion 与整站断网未实测，不补写通过。
- P1完整绑定因果：历史基线未交付；当前部位选择、关联层高亮、控制接管与保存姿态演示已实现，最终浏览器证据见§0，不再作为实现缺项。
- 扩展任务未做：表达式相对/绝对引用比较、批量合成设置操作、网页重复名称自检、真正的库保存/应用/格式导入。已有可达文档入口，不能把入口当功能实现。
- API 已有三个真实片段；完整命名空间图、可运行脚本打包和实际 AE 执行未做。`Duik.CmdLib` 的官方错误链接仍不复制。
- 素材身份、亮色、八面板与Tools四类继续锁定；“截图+步骤优先”是历史基线，不再是当前呈现约束。新首层用功能场景说明，官方截图保留证据与文档入口；不追加重复角色营销图或假AE按钮。Skill 内容、译文和上游快照不在本轮修改范围。

详细事实、固定源链接及素材/任务映射见 [LANDING_EXPERIENCE_DESIGN.md](./LANDING_EXPERIENCE_DESIGN.md) §2–§5、§10 和 [LANDING_CONTENT_AUDIT.md](./LANDING_CONTENT_AUDIT.md)。官方截图优先基线阶段曾同步方案、内容审读表、AGENTS 与 README，并记录当时构建/宿主结果。当前安装阶段仅回填本 Plan 与 README；不新增平行规划，不改角色、译文或 `upstream/`，不把历史验收迁移为本轮通过，未执行提交。
