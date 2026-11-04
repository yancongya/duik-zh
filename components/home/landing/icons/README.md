# Duik 官方面板与任务图标

本目录保留官方 SVG 的原始几何、画布与元数据，不重新绘制或优化路径。八枚主面板图标保持不变，另外四枚用于 OCO、库、笔记和自检任务，不构成新增主面板。除将 `dusan/check.svg` 本地命名为 `dusan-check.svg` 以区分来源外，文件名与原始字节均保持。图标用于指向相应文档，不暗示本站是官方产品。

## 来源与归属

- 仓库：`RxLaboratory/Duik`。
- 固定提交：`718e6e282d1ae91dc9678bb1a202ce08e862a28d`。
- 默认来源目录：`src-docs/docs/img/duik/icons/`；自检图标单独来自 `src-docs/docs/img/dusan/check.svg`。
- 上游文档作者：Nicolas “Duduf” Dufresne 与贡献者；软件与名称归属 RxLaboratory。
- 对应文档协议：GNU Free Documentation License 1.3；参见仓库根 `LICENSE-GFDL-1.3.md`、`NOTICE.md`，以及同一上游提交的 `src-docs/docs/misc/doc-license.md`。
- SVG 元数据没有另外声明逐图作者或独立协议，因此不替这些文件添加 MIT、CC0 等未经来源确认的授权。作为上游文档配套资产保留其归属与文档协议说明。
- 精确仓库路径记录在 `sources.json` 的 `sourcePaths`，SHA-256 记录在同名 `files` 条目；原文件 URL 由固定仓库、提交与 `sourcePaths` 组成。`rawBaseUrl` 仅是默认 Duik 图标目录，不能据此拼接 `dusan-check.svg`。
- 原八枚获取日期为 2026-11-01；2026-11-03 补入下列四枚，并将本地只读 Git 快照与该固定提交的官方 raw 文件逐字节比对，四枚均一致。仅改变本地文件名不会改变其 SHA-256。

| 本地文件 | 官方仓库路径 | 任务用途 |
|---|---|---|
| `oco.svg` | `src-docs/docs/img/duik/icons/oco.svg` | OCO 结构复用 |
| `library.svg` | `src-docs/docs/img/duik/icons/library.svg` | 动画库或脚本库 |
| `file.svg` | `src-docs/docs/img/duik/icons/file.svg` | 笔记编辑器 |
| `dusan-check.svg` | `src-docs/docs/img/dusan/check.svg` | 工程自检 |

## 使用约定

沿用官方实心、深色、紧凑技术图形。原始标称画布为 32 × 32，`viewBox` 可能以毫米或像素标记；不强行统一为 24 × 24。目录中按 24px 显示，小屏按 20px 显示。消费者用空 `alt` 将图标作为按钮文案的装饰，不用图形代替可访问名称。

发布路径为 `/duik-experience/icons/`。普通 `<img>` 保留原色；CSS mask 消费者使用 alpha mask，并由背景色控制展示色，不修改源 SVG。

本目录是原文件保真复用，不执行图标优化器：保留 Inkscape/编辑器元数据和未被绘图引用的 gradient 定义。通用审计会将 gradient 报为问题，应结合定义是否被使用与固定字节校验解释，不得为了让通用审计变绿而删除官方内容。审计产物不等于实际消费页面的小尺寸视觉验收。

2026-11-03 定向结果：原八枚通用审计通过；新增四枚仅 `library.svg` 被报告 `contains filter or gradient`（审计退出码 1）。该原文件保留三个 `linearGradient` 定义，但没有 `url(...)` 使用，也没有 `filter` 或远程绘图引用；其余三枚无审计问题。十二枚均通过项目的文件范围、精确来源、SHA-256 和无可执行内容守护。

审计命令：

```sh
node ~/.codex/skills/design-svg-icon-system/scripts/icon_system.mjs --dir components/home/landing/icons --names bone,constraints,controller,automation,animation,camera,tools,cmd --gallery /tmp/duik-catalog-icons.html
node ~/.codex/skills/design-svg-icon-system/scripts/icon_system.mjs --dir components/home/landing/icons --names oco,library,file,dusan-check --gallery /tmp/duik-task-icons.html
node --test --test-name-pattern='official SVG source bytes|taxonomy follows' scripts/test-duik-catalog.mjs
```
