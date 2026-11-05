# Duik 中文指南标志规范 · A / v1

2026-11-05：用户确认 A 方案及朱红/青绿方向，并授权正式接入。此为**非官方中文指南的演绎标志**，不代表 RxLaboratory 最新官方品牌规范。

## 唯一真源与交付

- 真源：`components/brand/logo.mjs`。256 × 256 画布，18 px 圆端点描边；保持批准的回环和沙漏几何，不重新绘制。
- 生成：`npm run brand:publish`；完整首页发布 `npm run landing:publish` 已包含品牌生成。
- 资源：`public/brand/v1/`。51 个 SVG / PNG / ICO 文件，另有 `tokens.json` 和带 SHA-256 的 `sources.json`。
- 规范预览：`/brand.html`；旧 `/logo-lab.html` 永久重定向到这里。
- 历史四案、脚本、预览与原始参考图已移出公开目录，恢复包为 `docs/logo-studies-archive-2026-11-05.tar.gz`；展开到独立目录后可按原路径检查。不要把归档中的旧发布器接回正式流程。

## 颜色与尺寸

| 用途 | 值 |
| --- | --- |
| 朱红回环 | `#d63d2f` |
| 青绿沙漏 | `#147d83` |
| 单色墨绿 | `#263c34` |
| 反白 | `#ffffff` |
| 配套纸色背景 | `#f8f6f0` |

透明 PNG 提供 16、20、24、32、40、48、64、96、128、180、192、256、512、1024 px，双色/单色/反白均从同一 SVG 输出。不将背景、阴影或文字烧进透明标志。

首页导航使用 36 px，文档导航 32 px，加载提示 96 px；常规界面以不小于 24 px 为宜，16/20 px 留给 favicon 等紧凑场景。SVG 等比缩放，不拉伸，标志外保留至少 1/8 图标尺寸的净空。

Apple 180 px 使用纸色底；PWA 192/512 px 为普通图标，另有经过安全区缩放的 `maskable-512.png`。`favicon.ico` 包含真正的 16/32/48 px PNG 帧，不是改扩展名。首页 SSR、Nuxt 接管后的 head 和 Nextra metadata 共用品牌链接；功能面板的控制器图标仍是功能图标，不全局替换。

## 动效与加载契约

- `logo.svg`：普通导航、标签、印刷与稳定状态，始终静态。
- `logo-intro.svg`：旋入＋两半聚合，约 1.45 秒完成，终态与静态标志一致。
- `logo-loader.svg`：相同进场，1800 ms 后进入 4.8 秒沙漏循环，**只由真实等待状态使用**。
- `logo-loop.svg`：只循环，供规范页可见演示使用；不是导航默认资源。
- 减少动态效果：SVG 内部直接显示静态；首页立即放行，无最小等待。系统偏好未实际切换，不能用受控事件测试替代。

首页 loading 是 `#__nuxt` 的外部兄弟节点，不参与水合、不锁滚动、不改变页面几何。**2026-11-06 最新：从单独淡出升级为连续镜头。** 缓存命中也保留完整 1800 ms 进场，接 820 ms Logo 向镜头推进（1→5.5倍）并虚化消散；背景同时溶解。Hero 在退场开始140 ms后，以标题→角色舞台→说明→CTA→底部条带五组、70 ms错峰进入，每组900 ms，从6 px模糊、轻微上移/缩放到清晰。两段重叠，最晚约3.12 s归于静止，不是逐段串行等待。资源始终并行加载；较慢时继续等待循环，不提供假百分比。Logo退场保留当前SVG帧，不切静态图。

仍有5秒等待上限，error、实际输入、后台、pagehide都会立即放行；这些中断在Logo退场及Hero错峰期间仍然有效，清除所有入场样式，不留下透明内容。深链接/reduced不等待，无JS不隐藏Hero。动画只作用于模板滚动宿主的子层，不改GSAP父级、布局、标题内部轮换或角色控制器；结束删除状态属性以释放filter/transform。此决定覆盖此前420 ms单纯淡出版，不增加新动画依赖或全屏backdrop blur。

只等待首屏角色和其解码/渲染就绪，不等待整页懒加载图片、下载 ZIP 或下方所有 WebGL。Hero 的 SSR/Vue/adapter 共用完整尺寸外壳，避免挂载后顶开内容。角色本身的错误 poster 与重试仍保留。

## 图片优化与证据

`npm run landing:optimize` 只产出 `public/riglab-project/optimized-v1/` 交付副本，通过 `components/brand/media-rewrites.json` 定向映射原网页请求；不覆盖原母图、原透明层或 rig JSON。使用 `cwebp -lossless -exact`（本机 1.6.0），没有 cwebp 则使用不量化的 PNG；每份输出必须逐字节比较解码 RGBA，连完全透明区的 RGB 也相同。

特别注意：sharp 的 PNG `effort` 会隐式开启 palette；普通 lossless WebP 会清除全透明区 RGB。两者都不能直接作为本项目的“逐像素无损”。生成器验证失败即停止。原 `sourceSha256` 与 `/riglab-project/source.png` 不变；fallback 通过独立的逻辑 URL 使用压缩副本。

定向回归：`npm run brand:test`。性能静态/HTTP：`node scripts/audit-duik-performance.mjs`，服务必须是本机 3017 上本次构建的 `next start`；脚本复用已安装 web-perf 的静态检查。浏览器观测仅 loopback `/?perf=1`，不向外部发送数据，普通首页不加载诊断模块。输出见 `output/brand-perf-2026-11-05/`，具体结果与未测项见 `docs/BRAND_PERFORMANCE_ACCEPTANCE.md`。

## 参考与归属

RxLaboratory/Duik 固定提交 `718e6e282d1ae91dc9678bb1a202ce08e862a28d`：`src-docs/home-html/duik.png` 及 `src-docs/aep/jissse/Duik parenting/(Footage)/DUIK_logo_full_dark-300x300.png`。原始参考图片及来源记录保留在归档；Duik 名称与上游标志归属 RxLaboratory 及贡献者。没有爬官网 HTML，也没有修改文档译文。
