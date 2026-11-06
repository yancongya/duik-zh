---
关联文档:
  - ../README.md
  - ./LOCAL_ARCHIVE.md
  - ./DOCS_MEDIA_DELIVERY.md
  - ./LANDING_REDESIGN_PLAN.md
涉及文件:
  - .github/workflows/deploy.yml
  - next.config.mjs
  - scripts/build-pages.mjs
  - scripts/lib/pages-export.mjs
  - scripts/lib/verify-pages.mjs
  - scripts/serve-pages.mjs
依赖服务:
  - GitHub Actions
  - GitHub Pages
---

# GitHub Pages 发布

2026-11-06 用户选择当前公开仓库 `yancongya/duik-zh` 的 GitHub Pages，并授权修复三个尚未推送的本地提交、推送和部署。不使用 Vercel、Cloudflare、远程镜像或备用落地页。

## 唯一发布流程

```bash
npm ci
npm run test:pages
npm run build:pages
npm run preview:pages
# http://127.0.0.1:3018/duik-zh/
```

`main` 的 push 触发 `.github/workflows/deploy.yml`：Node 22 → 检查 → 构建 → 上传 `out/` → `deploy-pages`。PR 只构建，不发布。首次启用选择 `build_type: workflow`，不把仓库协作文档 `docs/` 当网站根目录。

- 默认项目基路径 `/duik-zh`，构建支持 `DUIK_PAGES_BASE_PATH` 和 `DUIK_PAGES_ORIGIN`。
- 公开地址以 `gh api repos/yancongya/duik-zh/pages --jq .html_url` 返回为准；不能以本地构建成功代替线上成功。
- 本地 `npm run dev -- --hostname 127.0.0.1 --port 3017` 保留 Next 运行和原 rewrite。Pages 构建在 OS 临时目录中运行，不共享本地 `.next`。
- `out/` 为忽略的生成目录，仅带 `.duik-pages-build.json` 标记时允许自动替换。不提交生成站点，不推送本地备份分支。

## 保留完整交互的静态交付

1. 首页使用现有 `public/landing.html` 和完整 Nuxt/GSAP/绑定运行时，不用未启用的 React 首页替换它。
2. 文档保持 Nextra/Next 和已翻译 MDX。仅在临时源副本中，编译前给素材路径加项目基路径。**禁止对生成的 Next Flight/HTML/JS 做全局路径替换**，否则会破坏长度编码的数据，导致客户端 `Connection closed`。
3. 首页原图片代理依据已有 asset-map 转为本地真实文件；动态 SVG/poster 切换也走同一静态 resolver。不存在 Node 图片代理、HTTP 200 缺图占位或线上镜像。
4. 原 26 层 rig、控制器、滚动映射保留；交付 JSON 使用既有逐像素校验通过的优化副本，原 PNG 和 source hash 不改。
5. Pagefind 在导出后索引文档 article；旧重定向页不进入索引。首页↔文档跨运行时使用完整导航，文档内部仍保留 Next 导航。
6. 旧 `/docs/docs/...`、`logo-lab.html`、候选页使用静态 HTML 迁移入口；这不是服务端 308。真正缺失资源返回 404。

## 本地验收（本次）

- Pages 导出 136/136；132 篇文档、26 层 rig；Pagefind 索引 132 页。
- 普通 `npm run build` 137/137通过；3017在构建期间停止以避免共写`.next`，结束恢复。
- 1,401 个生成 HTML 本地引用存在，7,998 条内嵌 Flight 记录边界完整；每次构建自动复核。
- 浏览器：中文搜索“骨骼”后进入骨骼文档，文档图片无加载失败；返回完整落地页；Hero 右手控制器 x=674→679；绑定滚动进度 0→0.5652→1，回滚至0.8818。
- 不把源代码/HTTP检查当整页视觉验收：IAB 深滚截图仍有已记录的空白捕获问题；本次未重跑全尺寸/系统 reduced-motion/AE 实机验收。
- 原首页在3017和静态3018均有既存 `Hydration completed but contains mismatches` 提示；本次不以静默屏蔽日志方式处理，也不声称首页零警告。文档 `Connection closed` 已在本次静态构建修复。
- 53个官方旧MP4仍不可用；保持官方入口、来源和重试，不表示恢复播放。

## 未推送历史修复与恢复

GitHub 将模板图标文件名误识别为凭据。本次只修改三个未推送提交中的字符串序列化：JS/JSON使用等价Unicode转义，HTML属性使用数字实体；实际文件名与解码URL不变，没有关闭或绕过安全检查。

| 原本地提交 | 等价修复提交 |
| --- | --- |
| `25dd658` | `82aefda` |
| `0a5e915` | `981a0cf` |
| `44efc89` | `a457d48` |

远程祖先 `51e98017de1086188dc904f3ca7d52d19de90e56` 不变，不需要强推。原链保存在本地 `codex/pre-pages-20261106`；补丁、索引和映射备份位于相邻归档目录 `duik-zh-local-archive/pages-history-20261106-lu9sNg/`。旧文档中的提交号作为历史证据保留，按本表对照。**只推送 `main`，禁止 `git push --all` 将误报备份链重新推送。**

首次重试又定位到同一文件名的两种遗漏：历史清单中的带hash后缀副本，以及扩展名为PNG、实际是旧HTML捕获的未使用纹理文件。再次做等价实体/Unicode转义，记录在`history-map-additional.json`；中间链另存本地`codex/pre-pages-retry-20261106`。这不是有效凭据，也没有关闭推送保护。当前落地页不引用该旧纹理。

发布前的过时文件清理可按 [LOCAL_ARCHIVE](LOCAL_ARCHIVE.md) 恢复；仍在使用的 `output/riglab-demo/` 不纳入提交或清理。
