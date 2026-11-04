---
关联文档:
  - LANDING_REDESIGN_PLAN.md
  - LANDING_EXPERIENCE_DESIGN.md
  - CHARACTER_RIG_TEST.md
  - GLOSSARY.md
涉及文件:
  - components/home/landing/content.mjs
  - components/home/landing/orientation.mjs
  - components/home/landing/tools-demo.mjs
  - components/home/landing/motion-demo.mjs
  - components/home/landing/reuse-demo.mjs
  - components/home/landing/experience-catalog.mjs
  - components/home/landing/api-cinema.mjs
  - components/home/landing/tool-catalog.mjs
  - components/home/landing/guide-experience.mjs
  - components/home/landing/official-media/sources.json
依赖服务:
  - duik-zh 本地 Next.js 预览服务（3017）
---

# 落地页全局内容与素材对照

**2026-11-04最新交互覆盖：** 绑定首次滚入后连续演示一次，终态交还控制；图层管理替代裁剪成为Tools首个展示，文档对应 `/docs/guide/tools/layers`，裁剪在最后入口保留。其余展示可见自动循环，无播放/暂停/重播UI；不改角色身份、素材归属与真实功能。直接操控、复位、阅读入口保留，检索/FAQ/学习不自动切换。介绍与绑定延续原动态亮色色场；新验证单列Plan §0，历史全循环不作当前证据。

更新：2026-11-04。**本文件记录当前源码的内容、素材和交互边界；§4 保留2026-11-01历史验证，当前交付、验收与剩余范围只在 [改造 Plan §0](./LANDING_REDESIGN_PLAN.md#当前交付与剩余验收2026-11-04) 汇总。** 首层采用简短文案与可操作原理场景，官方截图及步骤在默认关闭的次级层。分段浏览器结果不外推整页连续验收、手机或真实 AE 执行。

本次对照范围是整张落地页，不止 Hero：从认识软件、理解面板和操作步骤，到文档检索、学习路径、FAQ 与来源说明。项目整体方案仍见 [改造 Plan](./LANDING_REDESIGN_PLAN.md) 和 [体验依据](./LANDING_EXPERIENCE_DESIGN.md)；角色身份及限幅见 [角色组件记录](./CHARACTER_RIG_TEST.md)。

## 1. 素材与事实基线

- 软件是 **RxLaboratory 的 Duik Ángela，运行于 After Effects 的脚本工具集**；本站是非官方中文指南，不是软件开发方，也不是浏览器版 Duik 服务。
- 官方截图固定于 `RxLaboratory/Duik` 提交 **`718e6e282d1ae91dc9678bb1a202ce08e862a28d`**，取自 `src-docs/docs/img/`；内容对照使用相应官方 Markdown 的本地译文，不爬取官网 HTML。
- [23 图来源清单](../components/home/landing/official-media/sources.json) 记录每张原图的固定源 URL、文档入口、尺寸、字节数和 SHA-256。本次只读校验确认 **23 个本地文件存在且哈希与清单一致**；这不等于核验线上最新版本，更不是实际页面加载证据。
- 素材真源为 `components/home/landing/official-media/`，发布 URL 前缀为 `/duik-experience/official/`。23 图是已归档的资源数量，不表示全部原图都已逐一展示；当前落点以下表对应源码为准。下表图片路径省略共同的 `duik/` 前缀；它们是官方文档原图，**不是本轮 AE 会话录制**。原图可能保留旧版本号、英文界面或旧式控件，不能据此承诺当前版本、兼容范围或界面完全一致。
- 官方截图保留原比例、原文字和归属；不能重绘一个相似面板后称为官方图。原创 SVG 只可标记为阅读路线、文档装饰或原理示意，不能冒充 AE 截图、真实 Duik 控件或 AI 生图。
- Hero 仍使用已确认角色及既有透明图层；它不是官方角色截图，也不是上传图片后由 Duik 自动拆层的成果。

## 2. 全页板块矩阵

下表“官方 MD 依据”以 `content/docs/` 内对应译文列示（源码为同名上游 `.md`）；“本轮处理”仅说明已写入源码的变化。

| 板块 / 源码 | 官方 MD 依据（本地译文） | 真实本地截图 | 文案与交互边界 | 本轮处理 |
|---|---|---|---|---|
| 导航与 Hero：`content.mjs`、`hero-slot.mjs` | `getting-started/introduction.mdx`、`getting-started/first-look.mdx`、`getting-started/install.mdx` | 无官方面板截图；保留已确认原创角色 | 明确 AE 脚本与非官方指南身份；拖拽控制器是有限幅度网页交互，不执行 AE，不改变角色身份 | 首屏说明软件形态与本站职责；主动作进入中文文档，导航新增“认识 Duik”；不把精选入口称为完整功能实现 |
| 初识 Duik / 独立面板：`orientation.mjs` | `getting-started/first-look.mdx`、`getting-started/install.mdx` | `individual-panels.png` | 独立面板截图不是全部八类主面板；先选图层/属性/关键帧，再调用工具，随后在 AE 编辑结果 | `#inside-ae` 用一句话说明 AE 环境，真实停靠面板按需展开；Hero 底部横条承载八主面板的官方图标与文档入口 |
| 三阶段绑定：`orientation.mjs` | `guide/bones/index.mdx`、`guide/bones/tools/link-art.mdx`、`guide/bones/autorig/index.mdx`、`guide/constraints/index.mdx`、`guide/controllers/index.mdx` | `bones/bones_panel.png`、`constraints/constraints-panel.png`、`controllers/panel.png` | 骨骼是 AE 形状图层，可创建或用预设骨架；Link Art 位于骨骼工具栏，约束截图不是它的所在位置；不是识图拆层服务或唯一绑定顺序 | 已准备的26层角色展开→归位并恢复已保存姿态→控制器接管；部位选择、关联层、网格与输入同步，有限播放等待镜头实际完成；真实面板进入详情，不重生角色或重置用户姿态 |
| Tools 四类：`tools-demo.mjs` | `guide/tools/index.mdx`、`guide/tools/composition/{crop,settings}.mdx`、`guide/tools/layers.mdx`、`guide/tools/text/{rename,search-replace}.mdx`、`guide/tools/scripting/` | `tools/{comp-tools,layer-tools,text-tools,script-tools}.png`；细节为 `tools/{rename,script-editor}.png` | 网页原理与官方操作分开。裁剪保持父合成位置；图层以预设名称说明组别/侧别/美术类型，不识图、不复刻命名算法或写入AE；样本文本不改AE表达式；编辑器仅编辑复制 | 四类共用固定参照与结果舞台：裁边、名称与标记、批量命名、取用片段。图层标签/四字段跟随同一播放头、选择和拖拽；26层角色筛选、原面板与完整编辑器按需展开 |
| 动画：`motion-demo.mjs` | `guide/animation/index.mdx`、`guide/animation/interpolation.mdx` | `animation/temporal-interpolation.png`；目录详情另有 `animation/animation-panel.png` | 官方步骤从选中关键帧开始；网页曲线只解释时间与位移，不是 Duik 的 Bézier 编辑器或插值算法复刻 | 同路径双对象比较时间节奏，可拖游标/单次播放；曲线与原图按需展开，具体插值文档取代重复全局 CTA |
| 自动化与表达式：`motion-demo.mjs` | `guide/automation/index.mdx`、`guide/automation/wiggle.mdx` | `automation/wiggle-effect.png`；目录详情另有 `automation/panel.png` | AE 中选属性后添加 Wiggle，参数在效果控件调整；网页使用确定性示意信号，不执行 Duik 表达式，不复现随机算法 | 联动装置表达位置/旋转/缩放变化，可调整幅度并有限播放；频率曲线与真实控件按需展开，入口直达 Wiggle |
| 摄像机：`motion-demo.mjs` | `guide/camera/index.mdx`、`guide/camera/camera-2d.mdx` | `cameras/camera-panel.png`、`cameras/2d-camera-effect.png` | 背景/深度层、摄像机影响与控制器属于 AE 操作；网页视差系数不是 Duik 默认值 | 三景层山景提供拖拽视点、拆层与有限运镜；原面板和精确参数按需展开，入口直达 2D 摄像机 |
| 复用圆环 / 三类库：`orbit.mjs`、`reuse-demo.mjs` | `guide/oco/index.mdx`、`guide/animation/anim-library.mdx`、`guide/tools/scripting/library.mdx`；辅助 `guide/{notes,sanity}.mdx` | `oco/oco_panel.png`、`animation/anim-library.png`、`tools/script-lib.png` | OCO 元绑定库、动画库、脚本库属于不同章节/层级，不是新增主面板；网页不读写 OCO/duio 工程、不保存或执行本机脚本 | 保留原8图环绕汇聚与五项选择，入口跟随当前选中内容；选择/保存/取用工作台在详情内，三状态各自保留，原图继续按需查看 |
| 八面板目录：`tool-catalog.mjs`、`experience-catalog.mjs` | `getting-started/first-look.mdx`、`guide/{bones,constraints,controllers,automation,animation,camera,tools}/index.mdx`、`guide/cmd.mdx` | 八个官方小图标；`panelScreenshots` 原图仅在详情，其中命令行使用 `cmd.png` | 八面板是官方分类；33 条是精选入口，不是全部命令。搜索/键盘操作打开文档，不执行 Duik 命令；Tools 继续细分四类 | 首层直接搜索与分类，默认四条骨骼入口；主动查看全部可访问33条。移除大海报及八张重复封面，搜索、标题与指南保持同步 |
| 学习入口：`guide-experience.mjs` | `getting-started/{install,first-look,introduction}.mdx`、骨骼/动画/Tools/API 对应文档 | 五任务复用官方小图标；安装详情保留292×529的 `home.png`，不再重复墙体封面 | 五条任务路径、16 个具体文档入口；路径是建议阅读，不强迫统一工作顺序；页面切换不修改 AE 项目 | 开放式主阅读入口＋后续链接，移除21处重复图片。安装步骤收入详情；保留链接图形术语、Tools四类入口、180ms指针反馈及即时键盘切换 |
| FAQ：`guide-experience.mjs`、`content.mjs` | `getting-started/introduction.mdx`、`getting-started/install.mdx`、骨骼/自动绑定、API 入门、`misc/doc-license.mdx` | 无大图，使用原生 `details` | 11 问分三组；明确 AE 基础、安装渠道、网页示意、项目移交和非官方身份；不写未经核实的兼容数字 | 分类筛选、展开/收起与具体文档链接；答案复用既有已核对文案，不凭营销诉求发明能力 |
| 脚本 API：`api-cinema.mjs`、`tool-catalog.mjs` | `advanced/api/{getting-started,duik-features,headless-scripts}.mdx` | `tools/script-editor.png`，作为官方脚本编辑器参考，不是浏览器执行截图 | 三个调用为 `Duik.Rig.arm()`、`Duik.Automation.wiggle()`、`Duik.Constraint.autoParent()`；需 AE ExtendScript、适配 API 包、初始化和正确选择对象；无 UI 时还需进入运行阶段 | 单舞台有限播放“选中对象→真实一行调用→能力结果”，可暂停/拖动；初始化、复制与官方图在详情内。不承诺片段复制即运行 |
| 页脚与来源：`guide-experience.mjs` | `misc/{credits,license,doc-license}.mdx`、项目 `NOTICE.md` | 无大图或装饰路径插画 | 软件由 RxLaboratory 开发；软件 GPLv3 与译文 GFDL 1.3 分开说明，保留 Nicolas “Duduf” Dufresne 与贡献者署名；不提供安装包镜像 | 主行动为“安装并开始使用”，另提供官方获取、上游源码/文档、许可证、致谢与回顶入口 |

## 3. 全局节奏与审读原则

1. **先知道是什么，再尝试网页示意。** Hero 给出软件形态与本站身份；主叙事使用短文案和可操作场景，官方界面与步骤进入默认关闭的详情。绑定第一阶段明确展示已准备好的透明图层，不提供自动拆图。
2. **不把所有能力画成同一组角色卡片。** 角色仅承担控制器体验；合成看蒙版与尺寸，动画看关键帧，自动化看属性规则，摄像机看景层，库说明复用的对象与条件。
3. **交互解释要和动作对应。** 分类用于筛选，步骤用于切换说明，图片放大用于查看官方原图；网页复制只复制文本，不能用成功提示暗示 AE 执行完成。
4. **基础分类与辅助功能分层。** 八主面板、Tools 四标签、三类库、笔记/自检、API 的层级分别保留；不把“管理”创造为官方第九面板，也不因没有网页演示就删掉文档入口。
5. **以真实术语和条件替代宽泛宣传。** “按内容裁剪”改为蒙版边界；骨骼说明 AE 形状图层；包络用于关节设计参考；Link Art 按中文文档名称呈现；API 写出初始化与运行阶段条件。

## 4. 2026-11-01 历史集成结果与验证边界

| 项目 | 当时结果 | 当时证据与边界 |
|---|---|---|
| 来源与本地素材 | 23 图文件、尺寸和 SHA-256 与清单一致；浏览器请求均为 HTTP 200 和真实 PNG | 官方历史截图不是当前 AE 实机录屏；保留原比例、英文与版本信息 |
| 当时源码内容 | 60 项测试总计，59 通过、1 项可选 browser 跳过；全页19组定向桌面检查通过 | Hero 拖拽/复位、四工具、三 motion、三库、学习/FAQ、检索/复制/键盘、资源与导航有实际结果；不扩展为全部辅助技术覆盖 |
| 构建 | `npm run build` 退出码0，137/137页生成；已恢复3017本地预览 | 日志 `output/duik-landing-build-2026-11-01-official-panels.log`，会话75705；保留既有多 lockfile workspace-root 警告 |
| 浏览器 | 实际 `3017 /`、1440×1000，18组首页与1组Nextra导航通过；首页错误/失败请求/外联均0 | 最终归档 `output/duik-experience-check/report-official-panels-2026-11-01.json`；文档 HTTP 200，但仍加载官方 MP4，因此不承诺整站离线 |
| 手机与跨断点 | 未在本文件验收 | 触控、窄屏文字/面板可读性、模态框、焦点与滚动；未测不能写全端完成 |
| 真实 AE / Duik | 未执行 | 对应安装版本中的面板位置、骨架/约束建立、实际关键帧与表达式结果、库文件读写和 API 运行 |
| 高级工作流 | 当时文档入口不等于功能实现 | 当时 P1 部位选择与关联层高亮未完整接入；当前绑定已实现这些联动，证据见 Plan §0，不能继续据此判为缺项。批量合成设置、相对/绝对表达式引用、实际库文件读写、工程自检和脚本打包属于未承诺的扩展，不是本轮整页完成门槛 |

该历史版本的文档区媒体外联与资源问题不能被首页本地化掩盖；本页不宣称整站断网可用。历史报告只证明当时范围，当前问题是否关闭以 Plan §0 的对应新证据为准。

2026-11-01 当时实际修复：workflow 图片加载曾造成约54.8px布局位移，预留容器后首次工具导航停在83.703125px（目标84±2px）；滚动时Vue重写头部class曾重新露出旧品牌/登录入口，改用稳定data标记后真实滚动复核通过。规则当时已同步AGENTS，开发/发布入口已同步README；不作为当前源码的新验收。
