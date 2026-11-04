---
name: character-rig-lab
description: 将已确认的透明 2D 上半身角色拆层、原坐标拼接、蒙皮与 IK，并用本地工作台验证。用于角色绑定、参考图控制器复现、继续 rig 测试页，以及导出支持拖拽或 hover 的独立网页组件；锁定角色身份并复用内置工具。
---

# Character Rig Lab

交付真实透明图层、带坐标和权重的 rig.json、本地制作工作台及可独立嵌入网页的角色组件。工作台与组件复用同一渲染核心；当前 `upper-body-2d-v1` 支持 26 个语义层、双臂 IK、头颈/腰部/表情/发束。

## 执行顺序

1. **锁定角色和工作区。** 找到用户已确认的源 PNG、现有 project.json、预览端口和工作区改动。记录源 SHA-256；角色身份、原图和已确认图层保持不变。候选补绘另存。独立实验室不自动替换产品首页。
2. **优先恢复现有项目。** 运行 `scripts/riglab.py --help`。已有项目先 `verify`，缺产物再 `build`；端口未运行则 `serve`。项目数据放在 Skill 外，避免 SkillDo 更新清空工作成果。
3. **区分素材路径。**
   - 复用本例：`init --demo`，直接复用已确认原图和语义标注，不重画。
   - 新原图：`init --source` 只复制并锁定图片，创建待标注项目。读 [project-schema.md](references/project-schema.md)，依据该图填写多边形、枢轴、骨骼、补底范围。完成所有必填标注再构建，不能套用示例坐标。
   - 需要重新生成透明部件或补全遮挡：先读 [generation.md](references/generation.md)，用可用的 imagegen/image-splitter 能力生成隔离候选。验收身份和关节补底后再接入；当前确定性构建器只支持原图可见像素，不把模型生成资产冒充原像素。
4. **构建和对齐。** `build` 读取数据化配方，导出 26 个 RGBA PNG、缩略图、支持贴图、共享网格、ZIP。构建时验证像素覆盖及静态合成逐像素一致；失败时不发布到现有 rig。
5. **控制器和交互。** 读 [controllers.md](references/controllers.md)。使用内置 WebUI；保留红色方形端点、半透明锥形骨骼、洋红细环、绿色视线及全局控件。位置跟随项目坐标，动作受 motionLimits 限制。不要仅画静态控制器或把单张原图当成已绑定结果。
6. **动态验收。** 运行 `verify --url`，真正拖动每个控制器、隐藏真实层、导入/导出姿态、播放/暂停动作。查看生成截图；数值通过不等于动作美术通过。向用户区分像素对齐、有限幅度动态测试与未验证的大幅动作。
7. **选择交付形态。** 工作台用于制作和验证；网页只需角色时，读 [embedding.md](references/embedding.md)，用 `export-component` 导出独立运行包，验证真实拖拽、hover 和多实例隔离。不要用 iframe 包住整个工作台，也不要另写第二套蒙皮实现。
8. **同步与复用。** 用户要求时 `deploy --public` 同步测试页、组件演示、共享运行时、素材和 ZIP；自动备份被替换文件。产品 Hero 需要另行确认，不属于 deploy。给实际预览地址与工作项目路径；代码由项目内此 Skill 目录维护，通过 SkillDo 更新中央副本并核对真实软链接，本地安装不等于远程发布。

## 一次启动示例

从 Skill 根目录执行，工作项目换成明确的绝对路径：

```bash
python3 scripts/riglab.py demo --project /absolute/work/rig-project --port 3018
```

`demo` 首次创建示例项目并构建，然后在 `127.0.0.1` 提供 WebUI。不需要 Next、Nextra、npm 安装或外网镜像。构建需要 Python 3.10+、Pillow、NumPy；依赖声明见 `scripts/requirements.txt`。日常再启动用 `serve`，不必重新生成。

```bash
python3 scripts/riglab.py serve --project /absolute/work/rig-project --port 3018
python3 scripts/riglab.py verify --project /absolute/work/rig-project --url http://127.0.0.1:3018/rig-test.html
```

浏览器验收另需 Node 22+ 和 Chrome/Chromium，`CHROME_BIN` 可指定路径；默认 macOS Chrome。使用隔离临时配置，不读取个人浏览器账号。验收记录保存在工作项目的 validation/。

## 完成标准与边界

- 源图哈希保持，PNG 是独立 RGBA 层；实际 alpha 合成还原源图。
- 关节、骨长和网格有限；12 个可见控制器实际改变对应姿态和画面。
- 错误角色的姿态文件被拒绝；本地资源全部来自同源，无在线代理。
- 导出包可用独立 HTTP 服务打开；组件移除后释放监听器、RAF 和 WebGL 资源。组件的浏览器验收与宿主框架接入验收分开记录。
- 静态图层、程序纹理补底、生成式补绘分别记录来源。本例仅为可见区域的受限 2D 蒙皮，不是隐藏解剖、3D 转头、手指绑定或 AE 工程。
- 新图需要新标注；当前工具不承诺任意图片自动语义拆层。若已有图层来自生成模型，保留候选与原图对齐证据，再扩展导入器，不能悄悄换图。

实现真源：`assets/webui/`；项目真源：工作目录的 `project.json` + `source.png`。派生测试页通过 deploy 更新，不双向手改两套运行时。

## Skill 回归

运行 `scripts/test_workflow.py` 检查锁定、缺标注拒绝与覆盖保护。`evals/evals.json` 定义三种真实任务；`scripts/evaluate.py --output <新迭代目录> --browser-report <已通过的报告>` 复现它们并生成 grading 和截图。用 skill-creator 的 eval-viewer 展示结果，收集用户反馈；这是确定性工具验收，不能宣称独立代理 A/B、节省了多少 token 或已经验证模型触发率。
