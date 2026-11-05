# 品牌、加载过渡与性能验收 · 2026-11-05

## 2026-11-06 增量：Logo推镜与Hero分组入场

本轮用户认为单纯淡出仍生硬，已改为1800 ms Logo进场＋820 ms推镜/虚化消散。Hero在退场开始140 ms后同步入场：标题、角色舞台、说明、CTA、条带，各900 ms，延迟0/70/140/210/280 ms。缓存命中仍保留品牌入场；资源并行加载。所有动画最终释放，实际输入/后台/减少动态效果可在等待、推镜或Hero入场任一阶段立即取消。保持角色、布局和原父级滚动运镜。

- `animate`的错峰与模糊衔接方案用于本次入场；`design-svg-icon-system`约束只改变宿主镜头、保留已确认A几何和静态品牌资产。无新增依赖、无全屏backdrop blur。
- 本轮定向45/45通过：`output/brand-perf-2026-11-05/tests-cinematic.log`。真实boot脚本覆盖暖缓存、慢就绪、错误、超时、深链接及五个退场时点的中断/迟到回调；不冒充系统设置实测。
- 本次`npm run build`退出0，137/137：`output/brand-perf-2026-11-05/build-cinematic.log`。
- 桌面连续帧与实际computed style：`cinematic-final.json`、`cinematic-final-0.png`～`cinematic-final-11.png`。第6～9帧记录五组实际延迟及依次清晰，第10帧后无入场filter/transform残留。初次观察发现CSS优先级抵消delay，已去除共用默认值并重验。
- 最终生产页角色ready、无横向溢出，点击聚焦右手控制器后原生Right键使x从684.021→689.021，见`cinematic-input.json`。只用定位器press未产生可靠聚焦，不计为成功输入。
- 浏览器控制台仍见`Hydration completed but contains mismatches`；历史日志15:50 UTC已出现，早于本次boot.js修改15:56 UTC。记录于`cinematic-console-baseline.json`，未定位或修复具体旧节点，不宣称零控制台错误；上一版PerformanceObserver的errors不包含console.error，不能用于否定此警告。
- 本次未重跑压缩/线上指标全套，以下51项和LCP/CLS是上一版证据，不外推到本次新镜头。移动端、系统reduced及全站长滚动继续未实测。

## 本轮完成范围

正式 A 标志、规范页、首页/文档导航与标签图标、首屏品牌进场、网页图像交付压缩。保留现有绑定、横向穿梭、圆环和目录设计；没有重生角色、覆盖译文、删除原素材或修改上游。未 commit/push/deploy。

依据已安装的 `design-svg-icon-system`、`animate`、`web-perf` 与 Impeccable optimize 约束：静态标志和状态动画分开，图片需要完整 RGBA 一致，性能数据区分本地 HTTP、浏览器采样与线上指标。没有使用 Lighthouse 或声称获得其分数。

## 前版加载行为（已由上方推镜版覆盖，保留历史证据）

缓存命中也播放 1800 ms 完整进场，再用 420 ms 淡出到 Hero。资源与角色在背后照常加载；若尚未 ready，进场之后继续循环，最迟 5 秒放行。实际输入、后台、错误、深链接和 reduced 保留跳过机制。此为明确授权的视觉过渡时长，不是网络加载耗时或假进度。

真实浏览器连续帧 `output/brand-perf-2026-11-05/boot-frame-states.json`：第 2～4 帧角色已 `ready`，遮罩仍完整可见；第 5 帧遮罩 opacity 约 0.148；第 6～7 帧遮罩移除、角色仍 ready。对应 `boot-frame-0.png`～`boot-frame-7.png`。证明暖缓存不再直接跳过进场。slow/error/timeout/reduced/晚到回调由真实 boot 脚本的受控生命周期测试覆盖，不冒充系统设置实测。

## 构建与回归

- 最终 `npm run build` 成功，137/137 页生成，`output/brand-perf-2026-11-05/build-final.log`；Build ID `0lw1sVJPqcpVqCM9mEodZ`。
- 最终定向 51/51 通过：品牌、SSR/Vue 同源、Hero 就绪/重试、导航、原图锁定及 IK；`scoped-tests-final.log`。未重跑所有历史落地页专项，不能写成全量回归通过。
- 6 个正式 SVG 通过技能审查；51 个资源从统一几何生成，PNG 实际像素和生成结果逐一对照。
- 构建前停止本仓库开发服务，再以 production `next start` 验证；结束恢复原 3017 开发预览。无并行读写 `.next`。

## 压缩与 HTTP

57 张交付副本合计 **3,900,447 → 2,628,660 字节，减少 1,271,787 字节（32.6%）**。这是这组文件的原始响应体字节，不是全站下载量或首次访问传输减少量；缩略图、回退图并非每次首屏都会使用。

- 原始 PNG 与 `rig.json` 保留；`cwebp 1.6.0 -lossless -exact` 保留全部 RGBA，包括透明区 RGB。缺少 cwebp 的环境使用保守 PNG 路径。
- 57 个原逻辑 URL 实际请求均 HTTP 200，返回体 hash 与对应交付副本一致，Content-Type 正确。
- 实际生产 HTTP 已有 gzip：入口 JS 922,381 → 263,220 字节；背景 JS 857,308 → 232,648 字节；rig JSON 445,674 → 64,713 字节。这是核实既有压缩，不冒称本轮新增的收益。
- favicon.ico、品牌 SVG、manifest、规范页均 HTTP 200。Nextra `/docs` 实际导航成功，head 和文档导航均使用 `/brand/v1/logo.svg`。
- 原始素材、ZIP 下载、工作台和未访问模块不因单次静态扫描而删除；旧 Logo 四案仅移出公开目录，恢复包在 `docs/logo-studies-archive-2026-11-05.tar.gz`。

HTTP 与输入身份记录：`static-http-final.json`、`http-summary-final.json`，包括 HEAD、dirty diff hash、lockfile hash、landing hash、品牌源 hash、Build ID。最终 landing SHA-256 为 `574e7bfabf8598f19a0b0e9c5b892e7265ebd321b38082f94f23931538481eff`。

## 浏览器观察与边界

最终本地 production 浏览器为 **1331 × 1086**，用户原缩放保留。`browser-production-final.json`：Hero/boot 均 ready，脚本错误 0、失败图片 0、水平溢出 false；CLS 约 **0.00046**。原来空槽挂载约 0.134 的主要位移已由共享 SSR 外壳消除；保留的标题 pill 有微小位移。

本次 LCP entry 为标题、约 424 ms；**不能据此说用户在 424 ms 就看到了整个 Hero**，品牌遮罩按用户要求保留约 2.22 秒。LCP、CLS 属于 loopback、暖缓存的单次实验样本，未做限速/低端 CPU、移动设备或 RUM，不外推线上性能。

浏览器实际走过首页 → 绑定（26 个透明层加载完成，滚动到可交互终态）→ 文档。正式规范页已查看双色/单色/反白及尺寸样张。本轮没有再次完整验收所有长滚动镜头；其实现未改。

尝试的 390 × 844 视口覆盖没有作用到被测隐藏标签，实际仍是 1600 × 900，已复原并保存为 `attempt-mobile-viewport-unchanged.*`；**手机验收未完成**，不把它算通过。系统级“减少动态效果”按用户要求未切换。

技能静态检查保留 8 条提示：19 个首页 img 缺尺寸属性（多为已有 CSS 固定画框/圆环及关闭详情中的图片）、原有 modulepreload、少量外部文档导航、独立工作台图片等。它们不是零问题报告，也不能仅凭字符串扫描认定页面发生 CLS；后续跨设备性能工作应继续核实。保留 Next 多 lockfile 的既有提示，不清理仓库外文件。
