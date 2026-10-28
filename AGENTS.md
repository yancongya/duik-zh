# AGENTS.md — 给 AI agent 的协作指南

本文件供在本仓库工作的 agent（Claude / Codex 等）快速对齐上下文。人类贡献者同样适用。

## 项目是什么

`duik-zh`：Duik Ángela（AE 绑定动画工具）的**非官方中文文档站**。
- 技术栈已锁定：**Nextra 4 + Next.js App Router**，不要提议换栈（VitePress/Docusaurus/Hugo 等一律拒绝）。
- 内容源已锁定：上游 GitHub `RxLaboratory/Duik` 的 `src-docs/docs/**/*.md` + `src-docs/mkdocs.yml`。**禁止爬取 duik.org 的 HTML。**
- 方案真身在 [`PLAN.md`](./PLAN.md)。动手前先读 PLAN §2（架构）、§3（同步）、§5（汉化）、§7（风险）。

## 硬规则（违反即返工）

1. **不覆盖已翻译内容**：`content/docs/**` 下已存在的文件（`translation-manifest.json` 中 status ≠ `untranslated`）永不被脚本/agent 用上游英文覆盖。
2. **不改上游快照**：`upstream/` 目录只读，由 CI 刷新；本地改动无效。
3. **协议合规**：译文以 GFDL 1.3 分发。每篇文档保留上游版权声明；不要删除 footer/meta 的归属信息；仓库根的 `NOTICE.md`、`LICENSE-GFDL-1.3.md` 不要删。
4. **术语一致**：新增/修改译文前查 [`docs/GLOSSARY.md`](./docs/GLOSSARY.md)。术语表没有的词，按 TRANSLATING.md 的仲裁顺序处理，并提议回写术语表。
5. **不做**：不提供安装包镜像；不伪装官方；不整站机翻直发（机翻只能作初稿，必须过术语与审校）；不把个人笔记混进 `content/docs/` 镜像树（个人内容放 `content/notes/`）。

## 目录职责

| 路径 | 职责 | agent 可否改 |
|---|---|---|
| `app/` | 路由与页面壳 | 可改（首页/文档壳） |
| `components/home/` | 首页区块 | 可改 |
| `content/docs/**` | 文档正文（翻译产出） | 可改（遵守不覆盖规则） |
| `content/docs/_meta.cn.json` | 中文导航标题 | 可改 |
| `scripts/` | 同步/转换脚本 | 可改 |
| `upstream/` | 上游快照 | **只读** |
| `docs/` | 协作文档 | 可改 |
| `.github/workflows/` | CI | 可改 |

## 常用命令

```bash
npm install
npm run dev        # 本地预览
npm run build      # 构建验证（改完必须跑）
npm run sync       # 盘点上游 → sync-report.json + translation-manifest.json
npm run nav        # mkdocs.yml → content/docs/_meta.ts
npm run convert    # 上游 md → 占位 mdx（跳过已存在文件）
```

## 典型任务流程

- **翻译一页**：确认 `content/docs/<path>.mdx` 不存在或为占位 → `npm run convert` 生成 → 按 GLOSSARY 翻译 → 更新 `translation-manifest.json`（status: translated，记录 upstreamHash）→ `npm run build`。
- **处理 stale**：manifest 中该页 `stale: true` → 对比 `upstream/docs/<path>.md` 与现译文 → 只重译变更段 → 清 stale。
- **上游结构变更**：`npm run nav` 后 diff `_meta.ts` → 报告重命名建议，**不要**自动 `git mv` 翻译文件。
- **首页改版**：只动 `app/page.tsx` 与 `components/home/`，不碰 `content/docs/`。

## 验收底线

改动后：`npm run build` 通过；不引入死链（首页↔文档跳转）；中文文案无术语冲突；新增文件遵守上述硬规则。
