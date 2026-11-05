---
关联文档:
  - ../README.md
  - ../AGENTS.md
  - ../PLAN.md
  - ./LANDING_REDESIGN_PLAN.md
涉及文件:
  - public/docs-img/
  - components/docs/Video.tsx
  - components/docs/video-policy.mjs
  - components/docs/video-status.json
  - components/docs/image-policy.mjs
  - mdx-components.tsx
  - scripts/audit-docs-media.mjs
  - scripts/lib/docs-media.mjs
  - scripts/test-docs-media.mjs
  - next.config.mjs
依赖服务:
  - duik-zh 本地 Next.js 预览服务（127.0.0.1:3017）
  - 外部媒体原站（仅视频和7个外链图片引用）
---

# 文档媒体交付与恢复

更新时间：2026-11-06。本批只修复文档媒体交付，保留已翻译正文和只读上游快照，不修改首页动画。

## 根因与修复

本地 sparse checkout 最初只包含 10 个 `public/docs-img` 文件，仓库实际追踪 739 个。缺图又被 `afterFiles` rewrite 返回 HTTP 200 的 640×180 SVG，占位成功状态掩盖了丢图。已扩展稀疏范围，恢复 739 个原文件（153,532,132 字节），移除假成功 rewrite。不存在的图片返回真正 404。

MDX 审计采用 Markdown AST，正确处理括号文件名、引用式图片和 JSX，避免正则误截路径。本次统计：132 篇文档、531 个不同本地图片引用、7 个外链图片引用、53 个不同视频源。`predev` 和 `prebuild` 默认只核对本地文件，网络检查为显式选项；图像格式按文件签名检查，HTTP 检查同时核对 MIME。

扩展稀疏检出前先盘点脏文件及现有规则。当前非 cone 工作区的增量示例（不是用 set 替换规则）：

```bash
git status --short
git sparse-checkout list
git ls-files -v -- public/docs-img
# 当前已有 non-cone 配置（core.sparseCheckoutCone=false），add沿用现有模式：
git sparse-checkout add 'public/**' 'scripts/**' 'components/**' 'skills/**' 'patches/**' '.gitignore' '.gitattributes' 'tsconfig.json' 'translation-manifest.json' 'sync-report.json' 'content/_meta.cn.json' 'LICENSE-GFDL-1.3.md' 'NOTICE.md'
npm run docs:media
```

扩展规则可能重新移除规则外的干净文件，必须保留整个运行时范围；不能只恢复几张截图而使 `_nuxt`、角色、发布脚本或主题补丁缺席。共享角色测试还依赖 `skills/character-rig-lab`，该目录同样应在稀疏范围。普通完整 checkout 不需执行 sparse 命令。

## 外部图片

`bassel.mdx` 的两个旧 Wikimedia thumbnail 地址返回 400。Commons `imageinfo` 确认签名文件已迁移为 `Bassel_Khartabil_signature.svg`，人物照片原文件仍可用。`image-policy.mjs` 精确映射这两个源地址，保留原文引用、替代文本和归属，不猜测其他地址、不加入镜像或占位。两个有效源 HEAD 分别返回 `image/svg+xml`、`image/jpeg`；另外五个外链仍由原站交付。

## 视频边界

2026-11-06 对正文中的 53 个旧 MP4 原地址进行 HEAD 检查，53/53 返回 404；上游安装文档仍引用旧源。官方原课程链接重定向至 `https://rxlaboratorio.org/rx-tutorial/duik-17/`，页面提供官方访问方式。已停止对受限媒体路径的进一步尝试，不下载、镜像或绕过访问限制。

`video-status.json` 保存精确原地址及核查时间。已确认失效源初始呈现说明、官方课程入口、重试和可展开的原地址，原地址不伪装成有效推荐链接；重试使用真实原视频，失败回到提示。未核实或可用源继续用原生视频 controls；不会因为网络超时就永久标记失效。字幕说明中的链接安全渲染，保留文字，不注入 HTML。

**本站视频播放尚未恢复。** 官方新源若要求账户或课程权限，应在官方完成访问，不能将提示回退当作完整媒体复刻。

## 维护和验证

```bash
npm run docs:media
npm run docs:media -- --origin=http://127.0.0.1:3017 --output=output/docs-media-images.json
npm run docs:media -- --check-external-images --check-videos --output=output/docs-media-audit.json
# 仅明确要刷新已核查源状态时执行：
npm run docs:media -- --check-videos --record-video-status
node --test scripts/test-docs-media.mjs scripts/test-docs-navigation.mjs scripts/test-docs-shell.mjs
DOCS_TEST_ORIGIN=http://127.0.0.1:3017 node --test scripts/test-docs-shell.mjs
npm run build
```

构建与 dev 不并发写 `.next`；结束恢复3017。外链检查发起原站 HEAD，不下载课程内容。默认/HTTP 图片失败令审计退出非零，视频失效单独报告，避免外站状态阻止本站图文构建。

证据目录：`output/docs-media-2026-11-06/`。

- `images.json`：本地引用与 HTTP 531/531 通过；原缺图复现的 `mytho01.jpg` 现在返回 JPEG，缺失路径返回404。
- `external-images.json`：7/7 外链图片按当前渲染地址返回成功图像 MIME。
- `full-audit.json`：53/53 旧视频源404；未镜像课程内容。
- `tests-final.log`：媒体、导航、文档壳16/16通过，含真实 Nextra 文档渲染和3017 live路由检查，无跳过。
- `build-final.log`：最终构建退出0，137/137页；随后恢复3017。
- 浏览器确认首页 Mytho 1664×697、Preamble 1920×1080，安装页三张操作图完整；点击重试后回到原失效提示，无新的未捕获播放异常。旧日志中稀疏恢复期间的 `docs-links.mjs` 缺失报错时间早于最终重启，不记为当前错误。
- Bassel 两张同素材映射在浏览器解码为300×96和2520×3128；保留正文与图片归属。
- 截图：`docs-restored-final.png`、`install-fallback-final.png`、`bassel-restored.png`。

本批不是所有图片逐张视觉检查，不承诺外部媒体离线可用。系统设置未改，未提交、推送或部署；译文与上游快照无差异。
