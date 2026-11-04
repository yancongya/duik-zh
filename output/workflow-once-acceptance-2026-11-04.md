---
关联文档:
  - ../docs/LANDING_REDESIGN_PLAN.md
  - ../docs/LANDING_EXPERIENCE_DESIGN.md
  - ../README.md
涉及文件:
  - components/home/landing/orientation.mjs
  - components/home/landing/tools-model.mjs
  - components/home/landing/tools-demo.mjs
  - scripts/test-duik-workflow.mjs
  - scripts/test-duik-tools.mjs
依赖服务:
  - duik-zh 本地 Next.js 预览（127.0.0.1:3017）
---

# 一次性绑定与图层管理主展示 · 2026-11-04

## 当前交互

绑定区首次65%可见且角色/26层解码就绪后自动展开→关联→控制。每镜头真实完成即衔接下一镜头，移除1800/3000ms固定停留。最后相机完成后开放拖拽，保持终态；结束后离开/返回、鼠标离开、焦点释放都不重播。用户中断或播放中离屏/后台则直接交还终态，未播放过的离屏不消耗机会。手动阶段与对应详情可继续查看。

Tools默认“图层再多，也能各就各位。”，沿既有几何舞台自动往返整理名称/组别/侧别/美术类型。SSR与客户端共用首项，裁剪降为末项。固定上游 `guide/tools/layers.md` 为功能依据，不声称自动识图。其他演示保留自动循环，全页无播放器按钮；角色、模板运镜、译文与独立绑定工作台不变。

animate用于一次性连续解释/终态交接，Impeccable保留当前视觉与缩减次要功能权重；没有新增动画依赖或重做角色。

## 代码回归与发布

- 同尺寸ResizeObserver不再取消正在进行的镜头；真尺寸变化重定向当前运动并保留完成等待。
- 加载代次与element/rig/cinema身份阻止错误发生后的旧decode写回ready，旧finally不影响新加载。重试不冒充用户手动阶段选择。
- 手动关联阶段打开详情或加载中选阶段不会被强行替换为control。
- 最终 `npm run landing:publish` 成功：[日志](workflow-once-publish-2026-11-04.log)。
- `npm run landing:test`：443总计、442通过、1项可选浏览器跳过、0失败：[日志](workflow-once-tests-2026-11-04.log)。其中workflow74、驱动15；Tools局部39含比较舞台，均不与总计重复相加。
- `npm run build` 退出0、137/137页：[日志](workflow-once-build-2026-11-04.log)。保留原多lockfile提示。停止已核实同仓库dev后构建，结束恢复3017，根页HTTP200：[运行日志](workflow-once-dev-2026-11-04.log)。
- `git diff --check`通过；最终 `orientation.mjs` 与已发布副本逐字节一致。构建后仅改记录，未commit/push/deploy。

## 实际浏览器证据

IAB，CSS视口1500×1086、用户缩放80%、DPR约0.8保持不变。所有采样：[浏览器记录](workflow-once-browser-2026-11-04.json)。

- 从根页点击原导航“角色绑定”滚入；384次采样记录：约360ms开始展开，1564ms进入关联，2809ms进入接管镜头，3834ms完成，此后到8476ms保持complete。相邻阶段约1204/1245/1025ms，跟随实际动画完成，没有旧读秒停留。时间从导航点击后的采样开始计算，不是硬编码产品时长。
- 真实手部拖拽：transform由 `translate(1050 655) scale(1)` 变为 `translate(1128.6772286288954 600.3515625) scale(1)`；拖前/拖后scrollY均5458.75。
- 离开至Tools再通过原导航返回，216次/约6秒采样始终complete:2，最后手部transform与拖后完全相同。最终相机identity，控制器宿主无inert。
- Tools初始已选layers，无播放操作；为将画幅完全移入视口使用定位器对标题/身份栏点击，再移到外侧释放接管。265次/约7.2秒采样始终running，进度经过0与100，名称从源名整理为短名并再次恢复，scrollY稳定7131.25。不是把用户点击播放当作自动启动。
- [图层管理主展示](workflow-once-tools-2026-11-04.png)：截图前后scrollY均6881.25。[最终角色交互](workflow-once-final-2026-11-04.png)：截图前后均5458.75。按实际DPR校准截取。
- 最终全页DOM匹配播放/暂停/重播/重新演示按钮为0；最终最近error/warn记录为空。不外推完整网络零错误。

## 边界

绑定中途离屏、resize、失败解码、reduced等异常路径由真实mount受控回归覆盖；不冒充本次每条异常均做了物理浏览器操作。自动验证器片段已同步，但本批未执行其浏览器主体；实际浏览器证据来自CUA。

本次仅定向验证绑定与Tools。下方Motion/API/复用等循环逻辑保留并通过代码回归，没有全部重新浏览器走查。未改变macOS辅助功能，系统级减少动态效果仍未实测；手机、AE与全站离线不在本次完成声明内。
