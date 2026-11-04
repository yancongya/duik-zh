# 工作台与角色组件

工作台 `rig-test.html` 用于查看图层、调姿态、对齐和导出；最终网页只挂载 `<character-rig>`。两者调用 `character-rig-core.js`，共享蒙皮、IK、限幅和控制器。修改核心后回归两种入口，避免制作效果与嵌入效果分叉。

## 导出

从 Skill 目录执行：

```bash
python3 scripts/riglab.py export-component \
  --project /absolute/work/rig-project \
  --output /absolute/work/character-component
```

输出目录及同名 `.zip`，目标必须不存在；保留已有导出。工作台的“导出可嵌入角色组件 ZIP”提供相同运行包。包含共享运行时、控制器、IK 许可和 `rig/` 素材，不带编辑面板，也不依赖 Nextra。导出的初始姿态是原定静止姿态；工作台临时调整的姿态需另行导出 JSON 并用 `importPose` 载入。

```bash
python3 -m http.server 3019 --bind 127.0.0.1 \
  --directory /absolute/work/character-component
```

打开 `http://127.0.0.1:3019/index.html`，左侧测试控制器，右侧测试 hover。

## 嵌入

将导出目录完整放到宿主网页的 `character/` 静态目录：

```html
<script type="module" src="./character/character-rig.js"></script>
<character-rig
  src="./character/rig/rig.json"
  interaction="both"
  controls="hover"
  style="width:480px;height:420px"
></character-rig>
```

- `interaction`：`drag` / `hover` / `both` / `none`，默认 `hover`。
- `controls`：`visible` / `hover` / `hidden`，默认隐藏；拖拽示例用 `drag + visible`，展示示例用 `hover + hidden`。
- 背景默认透明，Shadow DOM 隔离样式；宿主控制尺寸，可设置 `--rig-background`、`--rig-radius`、`--rig-aspect`。
- 资源与页面同源，通过 HTTP(S) 提供；不支持 `file://`，不依赖线上镜像。

## 宿主控制与生命周期

注册完成、元素已插入 DOM 且已设置 `src` 后等待 `ready`：

```js
await customElements.whenDefined('character-rig');
const element = document.querySelector('character-rig');
const rig = await element.ready;
rig.reset();
const pose = rig.exportPose();
rig.importPose(pose); // 校验角色身份，限制姿态范围
```

`element.rig` 还提供 `setPose`、`play`、`pause`、`blink`；DOM 事件为 `rig-ready`、`rig-change`、`rig-error`，`ready` 加载失败会 reject。每个实例状态独立，多个角色可同时存在。改变 `src` 或重新插入元素会重新加载，应等待新的 `ready`；业务监听器由宿主自行清理。

移除元素自动中止加载并释放 WebGL、观察器和 RAF。离屏或页面隐藏时暂停渲染；无交互时不持续刷帧。hover 轻微驱动头、视线、上身和头发，离开后回弹，拖拽开始时冻结 hover。遵循系统减少动态效果偏好，不强制自动播放。

React/Next 等宿主应在客户端注册元素，使用 ref/事件访问实例。通用 Web Component 验收不等于某一框架的 SSR、路由切换、类型声明或打包验证；只有用户要求接入时才在目标宿主补齐并验证，不自动替换产品 Hero。

## 验收入口

常规 `verify --url <工作台地址>` 同时运行工作台与同源 `rig-embed.html` 测试。单独验证导出包：

```bash
RIG_COMPONENT_ONLY=1 RIG_URL=http://127.0.0.1:3019/index.html \
  RIG_OUTPUT=/absolute/work/component-validation \
  node scripts/validate-browser.mjs
```

覆盖真实 hover 像素变化与回弹、控制器拖拽、多实例隔离、属性模式切换、姿态传递、卸载/重新挂载、加载中移除和 reduced-motion。验收报告中的错误与失败资源应为空；另查看截图确认角色未变。仍属于原图可见区域的有限幅度 2D 蒙皮，不把导出称为完整解剖重建或 AE 工程。
