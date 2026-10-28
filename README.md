# Duik 中文站（duik-zh）

> Duik Ángela（After Effects 专业角色绑定与动画工具集）的**非官方**中文文档站与产品介绍首页。

- 官方网站：[duik.org](https://duik.org/)
- 上游文档仓库：[RxLaboratory/Duik](https://github.com/RxLaboratory/Duik) · `src-docs/docs/`
- 技术栈：**Nextra 4**（Next.js App Router）· 内容直接同步上游 Markdown，不爬取官网 HTML
- 完整改造方案：见 [`PLAN.md`](./PLAN.md)

## ⚠️ 免责声明

本站为非官方中文社区翻译与知识库，与 Rainbox Laboratory / Nicolas "Duduf" Dufresne 及官方 duik.org **无隶属关系**。软件本体请仅通过官方渠道获取。

## 协议

| 内容 | 协议 |
|---|---|
| Duik 软件本体 | [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html) |
| 上游文档及本站译文 | [GNU Free Documentation License 1.3](./LICENSE-GFDL-1.3.md)（无 Invariant Sections / Cover Texts） |

译文属 GFDL 定义的「修改版」，归属与修改声明见 [`NOTICE.md`](./NOTICE.md)。

## 项目结构

```
app/                  Next.js App Router（首页 + 文档区路由）
components/home/      产品首页区块
content/docs/         中文/占位文档（MDX，唯一人工编辑区）
content/docs/_meta.cn.json  中文导航标题
docs/                 本站协作文档（GLOSSARY / TRANSLATING）
scripts/              同步与转换脚本
upstream/             上游 src-docs 快照（CI 刷新，勿手改）
.github/workflows/    同步 + 构建流水线
translation-manifest.json   翻译状态清单
sync-report.json      最近一次同步报告
PLAN.md               整站改造落地方案框架
```

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

常用脚本：

```bash
npm run sync       # 盘点 upstream/docs，更新 sync-report.json 与 translation-manifest.json
npm run nav        # 从 upstream/mkdocs.yml 生成 content/docs/_meta.ts
npm run convert    # 把上游未处理的 md 转为 content/docs 占位（永不覆盖已存在文件）
```

## 同步机制（摘要）

1. GitHub Actions 每周定时 / 手动触发，sparse checkout 上游 `src-docs` → 刷新 `upstream/`。
2. `scripts/sync-upstream.mjs` 对比 hash，更新 `translation-manifest.json`：
   - **已翻译文件永不被覆盖**，上游变更只标记 `stale`；
   - 未翻译占位文件可安全刷新。
3. 详情与冲突处理策略见 `PLAN.md` §3。

## 参与翻译

请先阅读 [`docs/TRANSLATING.md`](./docs/TRANSLATING.md)（翻译规范）与 [`docs/GLOSSARY.md`](./docs/GLOSSARY.md)（术语表）。

单文件为最小翻译单元；翻译完成后请在 `translation-manifest.json` 更新对应条目。

## 目录导航

- 产品首页 `/`
- 文档区 `/docs/*`（路径与上游 `src-docs/docs/` 一致，如 `/docs/guide/bones/autorig/leg`）

---

Copyright © RxLaboratory & contributors（上游原文）；中文译文贡献者见 git 历史。文档以 GFDL 1.3 分发。
