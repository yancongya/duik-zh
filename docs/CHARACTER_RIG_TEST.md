# 原定角色拆层与绑定测试页

更新时间：2026-11-01。关联文档：[`LANDING_REDESIGN_PLAN.md`](./LANDING_REDESIGN_PLAN.md)（Hero 与落地页当前执行计划）、[`PLAN.md`](../PLAN.md)（项目架构和内容边界）。涉及真源：`skills/character-rig-lab/`（角色工作台/运行时）和 `components/home/landing/`（首页宿主）；本地服务入口如下。历史验收结果和本轮宿主验收分开记录。

工作台：`http://127.0.0.1:3017/rig-test.html?rig=4`。组件演示：`http://127.0.0.1:3017/rig-embed.html`。独立 Skill WebUI：`http://127.0.0.1:3018/rig-test.html`。

工作台负责制作与验收，成品通过独立角色组件嵌入其他页面。最初的独立工作台阶段没有替换落地页；用户已于 2026-11-01 授权将同一组件接入首页 Hero，本轮已完成亮色与嵌入技术基线，产品体验重编排另列。Nextra 文档、原图和已确认的旧版图层不变。工作台默认不自动播放，方便先核对原姿态。

## 可嵌入组件

- `character-rig-core.js` 是唯一蒙皮、IK 和控制器实现；`rig-test.js` 只负责工作台面板，`character-rig.js` 提供独立 `<character-rig>` 元素。没有 iframe，也没有第二套角色运行时。
- 组件背景透明，使用 Shadow DOM 隔离样式；多个实例独立。支持 `interaction="drag|hover|both|none"` 与 `controls="visible|hover|hidden"`。
- 演示页左侧可直接拖动控制器，右侧 hover 驱动头部、视线、上身和头发，移出回弹。使用同一套已确认图层和限幅，不重画角色。
- 无操作时不持续刷帧，离屏/隐藏暂停，卸载自动释放 WebGL、监听器与观察器；支持系统减少动态效果偏好。
- 工作台头部可下载组件 ZIP，或用下方命令导出独立目录。导出包无 Nextra 依赖，可单独通过 HTTP 服务打开。

```bash
python3 skills/character-rig-lab/scripts/riglab.py export-component \
  --project output/riglab-demo --output output/character-component
```

目标目录及 ZIP 必须不存在，重复导出使用新路径。当前导出在 `output/character-component/` 和 `output/character-component.zip`，独立预览 `http://127.0.0.1:3019/index.html`。

将导出目录复制到宿主静态目录的 `character/` 后：

```html
<script type="module" src="./character/character-rig.js"></script>
<character-rig src="./character/rig/rig.json"
  interaction="both" controls="hover"
  style="width:480px;height:420px"></character-rig>
```

`ready` Promise 就绪后通过 `element.rig` 操作姿态、播放、暂停、复位和姿态导入导出；工作台临时姿态不会自动写入组件包，需另行导出姿态 JSON。组件资源与宿主页同源，不使用 `file://`。完整宿主契约与验收命令见 `skills/character-rig-lab/references/embedding.md`。通用组件已独立验证，但该历史结果不等于首页宿主接入已通过；当前 Hero 接入见下一节。

## Hero 宿主接入（2026-11-01，技术基线）

- **授权范围**：替换首页旧提示词输入框，显示辅助控制器并支持拖拽/hover；落地页全局改为亮色。不是更换角色、制作新动作系统或将工作台整体嵌入首页。
- **当前路线**：duik-zh 仍是 Next.js App Router + Nextra 工程；根路由重写到本地 `public/landing.html`。既有 Nuxt/Vue 动画壳的空槽位挂载同一 Web Component，本阶段不是 React 重写或根路由迁移。
- **接入真源**：`components/home/landing/hero-slot.mjs` 提供空槽位；`adapter.js` 挂载 `<character-rig src="/riglab-project/rig.json" interaction="both" controls="visible">`，包含复位、控制器显示切换、文档入口与本地原图回退。`theme.css` 的亮色只作用于落地页，不影响 Nextra 正文。统一用 `npm run landing:publish` 发布。
- **对比区复用**：`pose-slot.mjs` 使用同核心的第二个独立实例，配置 `interaction="drag" controls="visible"` 并提供复位。两实例共享锁定素材和实现，不共享姿态；实际隔离效果待本轮宿主验证。
- **发布基线**：不可丢失的输入在 `components/home/landing/baseline/`，原 `output/landing-before-light/` 仅作恢复副本。不要只改 `public/`，也不要在基线中继续改文案。
- **控制器**：默认显示，继续使用本 Skill 已实现的配色、形状、控件职责和限幅；Hero 不重画另一套外观控件，不把不可拖动的覆盖图冒充实际控制器。
- **身份与边界**：同一锁定原图、同一 26 层、同一蒙皮/IK 核心；保留“网页交互示意 · 实际角色绑定请在 After Effects 中使用 Duik”说明。拖拽仅为有限幅度浏览器演示。
- **生命周期**：Vue 槽位卸载调用清理，移除组件后由 Web Component 释放资源；实际卸载、重新挂载及 hover/drag 协同仍需在首页验证，不能仅据源码宣称通过。
- **验收状态**：本轮 `landing:test` 11/11、角色测试 8/8、`npm run build` 137 页通过。实际 Hero 拖拽、头腰键盘、复位、12 个控件显隐、hover 与原旋转词已验证；独立 hydration 报告为零差异、零 console/资源/外网错误。长滚动后的 CTA 用原 Lenis 回顶并确认真实命中后成功进入 Nextra。宿主报告、导航专项及遗留见 `LANDING_REDESIGN_PLAN.md` §5.3；未重跑修正后的整套 host 脚本，不把部分成功写成整页全部通过。

本轮不重建拆分素材、不扩大动作范围，也不把 See-through 生成或 AE 原生绑定能力写成已经接入。工作台 `/rig-test.html` 与演示页 `/rig-embed.html` 保留用于后续复用。

## 已实现

- 原定 1312 × 1199 RGBA 角色直接拆成 26 个 PNG，保留原图像素；不是重新生成的角色，也不是把整张母图当作绑定结果。
- 胸部、腰、颈、面部、两耳、前后发和侧发、双侧袖子/上臂/前臂/手、眉眼瞳孔、鼻和嘴分别导出。透明图层有 bbox、父骨、枢轴、索引与权重。
- 先按原始坐标恢复，再通过同一组网格顶点/权重变形。切口两边共用顶点，避免把关节仅当作独立方块旋转时产生脱节。
- 两条双骨 IK 链，腰部平移、上身倾斜、头颈倾斜、抬手腕旋转；显示可拖动控制器与骨骼。
- 眨眼、视线、眉毛、微笑、发梢，以及待机/抬手演示。拖动时停止演示，保留当前姿态。
- 图层隐藏/独显、原图/叠加对照、网格、展开视图、复位、透明层 ZIP 与姿态 JSON 导出。

## 原图锁定

- 原始源：`public/duik-character/source/character-selected-v1.png`；Skill 内锁定副本：`skills/character-rig-lab/assets/demo/source.png`（相同 SHA-256）。
- SHA-256：fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a
- 原图和 `layers-selected/` 没有改写；旧 `rig-v2/` 保留。当前生成产物在 `public/riglab-project/`，由工作项目 `output/riglab-demo/` 发布。
- 构建脚本同时验证：所有可见像素有归属；独占分区拼接逐像素一致；导出的 PNG 实际 alpha 合成逐像素一致。
- 原图含少量远离主轮廓的微弱透明边缘；保留它们，缩略图采用独立 visualBBox，避免它们把部件预览缩得过小。

## 参考项目与实际复用边界

[RevStudio/Rev2D](https://github.com/RevStudio/Rev2D) 的 `src/core/rig/ik.ts` 为双骨 IK 参考。局部适配真源在 `skills/character-rig-lab/assets/webui/rig-vendor/rev2d-ik.js`，发布副本在 `public/rig-vendor/`，MIT 许可文件同目录。保留余弦定理、原弯曲方向、可达半径夹取；适配器只处理本测试页需要的世界坐标、固定骨长，不声称使用 Rev2D 的整套编译器/物理系统。

See-through 的生成式分层不能当作已接入服务。本次没有运行它，也没有调用未提供的生成模型；避免重新生成整个人物造成身份漂移。Image Splitter 的独立 RGBA + 原 bbox 回放约定用于导出，不启动额外 NAS 或 Docker 服务。

## 真实限制

这是**原图可见区域的受限 2D 蒙皮**，不是完整隐藏解剖重建或 AE 工程。手部目标偏移限制 105 原图像素，头部 ±8°、上身 ±4°、手腕 ±18°。超出范围的拖动会夹取，不会拉长骨骼。

眼睛/眉毛/嘴移动需要底图：面部补底采用原图邻近肤色纹理传播，眼白补底为单独支持贴图。它们是可追溯的处理结果，不冒充母图里本来存在的隐藏像素。它不支持 3D 转头、手掌翻面、手指独立绑定或大幅换姿势；这些需要另行制作通过身份审核的遮挡补绘素材。

## 可复现命令

从 duik-zh 根目录运行：

    python3 scripts/build-character-rig.py
    node --test scripts/test-character-rig.mjs
    npm run dev -- --hostname 127.0.0.1 --port 3017
    node scripts/validate-character-rig.mjs
    npm run build

拆分脚本只依赖 Pillow 和 NumPy。浏览器验证使用独立临时 Chrome 配置，通过标准 DevTools 协议执行真实鼠标拖动，不使用个人 Chrome 配置、账号或 cookie。默认 Chrome 路径为 macOS；可设置 CHROME_BIN。可用 RIG_URL 覆盖测试入口。

验证结果：`output/rig-validation/report.json`；截图同目录。覆盖原图对齐、所有 12 个控制器的鼠标交互、真实图层隐藏、展开/复位、闭眼、动画前进/暂停、100 组边界内姿态、键盘连续操作、姿态导入导出与身份拒绝、1440/1280 桌面，以及控制台与资源错误。浏览器实际取源文件计算 SHA-256。

## 可复用 Skill（2026-11-01）

真源目录：`skills/character-rig-lab/`；WebUI、构建器、校验器、示例配方和生成约束均已收纳，不是只有步骤说明。`scripts/build-character-rig.py` 与 `scripts/validate-character-rig.mjs` 现在只是兼容入口。运行时代码只在 Skill 的 assets/webui/ 修改，再通过 deploy 更新 public/。

控制器按用户参考图采用红小方块端点、锥形半透明红/蓝/紫骨骼、洋红细环、绿色视线/整体移动控件；标签默认隐藏。新增左右发束、表情、视线、方向与全局控件可以实际拖动，非静态装饰。

从 Skill 根目录：

    python3 scripts/riglab.py demo --project /absolute/work/character --port 3018
    python3 scripts/riglab.py serve --project /absolute/work/character --port 3018
    python3 scripts/riglab.py verify --project /absolute/work/character --url http://127.0.0.1:3018/rig-test.html

首次 demo 初始化并构建；后续 serve 直接复用。新人物用 init --source，只锁定源图和建立待标注项目，不套用旧人物坐标。角色位置、多边形、枢轴、补底、变形场和限幅都是 project.json 数据。当前上半身 profile 固定 26 层。

SkillDo 登记为 local_copy，sourceRef 指向项目内真源；Codex 入口应为指向 ~/.skillshub/character-rig-lab 的真实软链接。当前 SkillDo 的 track-local 不接受标准 evals/ 目录，因此使用 install 的本地 sourceRef，正常 update --skill 刷新；保留标准评估目录，不修改 SkillDo。未提交、未推送，也没有宣称跨设备远程可用。

## 初版工作台验收记录（2026-11-01）

- 7 项工作流保护测试 + 8 项原图/IK/权重测试通过。
- 项目测试页、源码独立 WebUI、SkillDo 安装版独立 WebUI 都通过真实 Chrome 验收。安装版从新工作项目构建，验证命令在 /tmp 下执行，未依赖 Nextra。
- 证据分别在 output/rig-validation/、output/riglab-standalone-validation/、output/riglab-installed-validation/；均无浏览器异常和失败资源。100 个有限幅度姿态的最大骨长误差约 2.3e-13 像素。
- 导出 PNG 实际合成逐像素一致；浏览器网格与缩放采样并非逐像素同渲染，实测平均预乘通道误差约 2.143/255（阈值 4）。
- Skill 的三个确定性案例共 10 项断言通过，结果在 skills/character-rig-lab-workspace/iteration-1/；审阅页为 output/character-rig-skill-review.html。未进行独立代理 A/B 或触发率评估。
- 项目真源与 SkillDo 中央副本的 21 个文件哈希一致；Codex 入口为实际软链接。工作项目在 output/riglab-demo/ 与 output/riglab-installed-demo/，不写进安装目录。
- npm run build 通过，生成 137 页；没有改写 content/docs/，也没有提交或推送。

## 组件验收记录（2026-11-01）

- 工作台抽离共享核心后回归通过：原图对齐、全部 12 个控制器、姿态进出、图层操作与有限幅度动作保持。
- 公共目录的组件演示与独立导出包均完成真实 Chrome 测试：hover 像素变化/回弹、真实控制器拖动、多实例隔离、属性模式切换、姿态传递、卸载/重新挂载、加载中移除、减少动态效果。
- 证据在 `output/rig-embed-validation/report.json` 和 `output/rig-export-validation/report.json`，两份报告均通过且无浏览器异常或资源失败。
- 新增 5 项导出保护测试，合计 12 项工作流测试及 8 项原图/IK/权重测试通过；独立包文件与工作项目素材逐字节一致，已有目录或 ZIP 不被覆盖，拒绝外部符号链接素材。
- 更新后的组合验收 `output/rig-validation/report.json` 通过 15 类检查。SkillDo 安装版组件在 `/tmp` 下执行验收亦通过，证据为 `output/rig-installed-component-validation/report.json`；独立服务的 `/component.zip` 可正常导出 67 个文件。
- Skill 真源与中央副本 26 个文件内容一致，Codex 入口仍为真实软链接。`npm run build` 通过并生成 137 页，3017 预览已重启；原图 SHA-256 未变。构建仍提示父目录存在多个 lockfile，本次不修改无关工作区配置。

## 下一阶段

1. Hero 宿主和亮色技术基线已经接入；按 `LANDING_EXPERIENCE_DESIGN.md` 将后续内容扩展为完整工具体系。角色只承担绑定与有限幅度动作示意，不代表全部 Duik 面板；新板块仍逐个推进。
2. 保留工作台、独立组件和首页宿主的职责分离，确认同一核心的复用没有产生第二份绑定逻辑。
3. 更大运动范围、隐藏部位补绘、3D 转头或手指绑定仍不在本轮范围；如后续需要，先单独确认素材与身份验收标准，不改写当前已接受角色。
