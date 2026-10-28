# TRANSLATING — 翻译规范

> 配套术语表：[`GLOSSARY.md`](./GLOSSARY.md) · 状态清单：`/translation-manifest.json` · 方案：`/PLAN.md` §5

## 1. 翻译单元与流程

1. 以**单个 md/mdx 文件**为最小单元；按目录批次推进。
2. 确认目标文件在 `content/docs/` 下不存在或是英文占位 → 需要翻译。
3. 英文原文以 `upstream/docs/<相对路径>.md` 为准（不要以官网 HTML 为准）。
4. 翻译 → 自查 → 在 `translation-manifest.json` 把对应条目改为：
   ```json
   { "status": "translated", "upstreamHashAtTranslation": "<sync-report 中的 hash>", "lastTranslated": "YYYY-MM-DD", "translator": "..." }
   ```
5. `npm run build` 必须通过。

## 2. 语言风格

- 简体中文，面向 AE 动画师，避免机翻腔。
- 保留操作步骤的祈使语气（「选择」「点击」「拖动」）。
- 数字、单位、快捷键、菜单路径中的英文标识不译（如 `Layer > New > Null Object` 可写作「图层（Layer）> 新建（New）> 空对象（Null Object）」，熟练路径可简化）。
- 长句拆短；被动语态改主动。

## 3. 术语

- 一律先查 `GLOSSARY.md`。
- 术语表没有：
  1. 查 Adobe AE 官方中文帮助；
  2. 查 AE 中文社区通行译法；
  3. 仍无 → 「English（中文描述）」并在 PR 中提议回写术语表。
- 同一文件内同一术语译法必须一致。

## 4. 保留不译的内容

- 产品/工具/函数/面板名（Duik、Kleaner、Effector…）
- 代码块、表达式、路径、URL
- 上游版权声明、META 归属信息（转换为 frontmatter 后保留字段）
- 协议名称（GFDL、GPL）

## 5. 图片与链接

- 图片路径由 `md-convert.mjs` 统一重写；翻译时不要手改回绝对路径。
- 图片如含英文 UI，可补中文图注（`components/docs/Figure` 或正文说明），**不要**直接改上游原图冒充官方图。
- 站内链接保持路由形式；外链保留并加 `target=_blank`（若组件未自动处理）。

## 6. 结构适配

- 上游 `!!! note` 等 admonition 已由转换脚本变为 `<Callout type="...">`；翻译时保持结构。
- 不要引入上游没有的标题层级；H1 与页面标题一致。
- frontmatter 中保留 `license: GFDL-1.3` 与上游作者/版权字段。

## 7. stale（上游更新）处理

1. `translation-manifest.json` 中该文件 `stale: true`。
2. diff：`upstream/docs/<file>.md` 与「上次翻译依据版本」（可用 git 历史或 manifest hash）。
3. **只重译变更段**，不要整篇重来。
4. 更新 manifest：新 hash、清 stale、更新日期。

## 8. 机翻使用边界

- 允许用 LMT/工具生成**初稿**。
- 必须人工或 agent 按本规范 + 术语表逐句过一遍。
- 禁止整站机翻后不审直接合并。

## 9. 提交

- 一个 PR 一个目录批次或一个主题，便于审校。
- PR 描述注明：翻译范围、术语新增、是否机翻初稿+人工审。
