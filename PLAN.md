# duik-zh（Duik 中文站）整站改造落地方案框架

> 状态：v1.0 · 技术路线已锁定，本文档只做落地细化，不做选型讨论
> 上游：[RxLaboratory/Duik](https://github.com/RxLaboratory/Duik) · `src-docs/docs/` + `src-docs/mkdocs.yml`
> 协议事实：软件本体 GPLv3；**文档为 GNU FDL 1.3**（翻译属「修改版」，见 §7.2）

---

## 1. 总体策略

### 1.1 源内容策略

- **唯一内容源**：上游仓库 `src-docs/docs/` 下的 Markdown（约 100+ 篇），配合 `src-docs/mkdocs.yml` 的 `nav` 结构。
- **不爬官网 HTML**：duik.org/guide 是 mkdocs 渲染产物，爬取会产生解析噪声、丢失结构、且无法回溯 diff。
- **双语并存**：
  - `upstream/`：上游英文原文镜像（快照，用于 diff 与回溯，不可手改）。
  - `content/`：中文工作区（翻译后的 MDX，可手改）。
- **结构映射优先于内容翻译**：先用脚本把 mkdocs 结构 1:1 映射成 Nextra 结构（路由、导航、图片），再进入翻译环节。结构问题一次解决，翻译问题按文件批量推进。

### 1.2 站点双层结构

| 层 | 路径 | 形态 | 职责 |
|---|---|---|---|
| 产品首页 | `/` | 自定义 React 落地页（非 docs 首页） | 产品介绍、下载引导、能力展示、导流到文档 |
| 文档区 | `/docs/*` | Nextra 文档站 | 知识库：指南、教程、API、FAQ、术语表 |

两层共享同一套设计 token（颜色/字体/间距），但首页允许更强的视觉表达（Hero、大图、动效），文档区保持克制的阅读体验。

### 1.3 与官方站的关系

- **定位**：非官方中文社区镜像 + 个人知识库，不是 duik.org 的替代品。
- **必须显著声明**（首页页脚 + 文档区侧栏底部）：
  - 本站为非官方中文翻译，内容基于 RxLaboratory 官方文档；
  - 链接回官方站 duik.org 与上游 GitHub；
  - 保留上游版权行与 GFDL 协议声明。
- **不做**：不伪装官方、不提供安装包镜像下载（只链到官方渠道）、不修改上游代码语义。

---

## 2. 技术架构（已定路线内细化）

### 2.1 Nextra 目录结构建议

```
duik-zh/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根 layout（字体、主题、全局 Provider）
│   ├── page.tsx                  # 产品首页（自定义落地页，不走 Nextra）
│   └── docs/                     # Nextra 文档区
│       ├── [[...slug]]/
│       │   └── page.tsx          # Nextra 动态路由渲染（generateStaticParams）
│       ├── _meta.ts              # 顶层导航（由脚本从 mkdocs.yml 生成初版）
│       └── ...
├── content/                      # 中文内容（MDX，唯一人工编辑区）
│   ├── docs/                     # 镜像上游 src-docs/docs 目录结构
│   │   ├── _meta.cn.ts           # 中文导航标题（本地维护）
│   │   ├── index.mdx
│   │   ├── getting-started/
│   │   ├── guide/
│   │   │   ├── bones/
│   │   │   ├── constraints/
│   │   │   ├── controllers/
│   │   │   ├── automation/
│   │   │   ├── animation/
│   │   │   ├── camera/
│   │   │   ├── tools/
│   │   │   ├── oco/
│   │   │   └── ...
│   │   ├── advanced/
│   │   ├── misc/
│   │   └── img/                  # 上游图片（同步进来，本地可补充中文标注图）
│   └── home/                     # 首页文案/区块数据（JSON 或 MDX，本地维护）
├── upstream/                     # 上游快照（CI 写入，本地 .gitignore 或定期提交）
│   ├── mkdocs.yml
│   └── docs/                     # src-docs/docs 原样
├── components/                   # 首页区块 + 文档增强组件
│   ├── home/                     # Hero、FeatureGrid、CTA、DownloadCard...
│   └── docs/                     # Callout、Video、Figure、Term...
├── lib/
│   ├── nav.ts                    # 解析 mkdocs.yml / _meta，生成侧栏
│   └── i18n.ts
├── scripts/
│   ├── sync-upstream.mjs         # 拉取上游 + 结构 diff + 生成清单
│   ├── mkdocs-to-nextra.mjs      # mkdocs.yml nav → Nextra _meta 转换
│   └── md-convert.mjs            # Markdown 语法适配（ admonition / META / 链接 ）
├── .github/workflows/
│   ├── sync-upstream.yml         # 定时 + 手动同步
│   └── deploy.yml                # 构建部署
├── docs/                         # 本仓库自己的说明（翻译流程、术语表）
│   ├── GLOSSARY.md               # 术语表
│   └── TRANSLATING.md            # 翻译规范
├── next.config.mjs               # withNextra 配置
├── package.json
└── PLAN.md
```

**决策**：
- Nextra `contentDir` 指向 `content/docs`，App Router 页面薄壳化，内容与代码分离。
- 首页完全自建（`app/page.tsx` + `components/home/`），不套 Nextra 的 `Page` 组件——保证产品感不受 docs 布局约束。
- 路由：文档区统一 `/docs/<path>`，路径与上游文件路径保持一致（`guide/bones/autorig/leg.md` → `/docs/guide/bones/autorig/leg`），便于同步脚本映射与人工对照。

### 2.2 内容目录与前端目录分离原则

| 目录 | 谁改 | 何时改 | 可否被 CI 覆盖 |
|---|---|---|---|
| `content/docs/**` | 译者/agent | 汉化与修订 | **永不自动覆盖**（只标记 stale） |
| `content/docs/_meta.cn.ts` | 译者 | 导航中文标题 | 永不覆盖 |
| `content/home/**` | 站点维护者 | 首页迭代 | 不在同步范围 |
| `upstream/**` | CI | 每次同步 | 是（整目录刷新） |
| `app/`、`components/`、`lib/`、`scripts/` | 开发者 | 功能迭代 | 不在同步范围 |
| `public/` | 开发者 | 静态资源 | 不在同步范围 |

### 2.3 主题/样式定制方向

目标气质：**现代 SaaS 产品站 + 克制的知识库**，摆脱「传统 docs 气质」（密排、灰蓝、侧栏树状挤压）。

- **设计 token**：CSS variables 定义色板（主色建议取自 Duik 品牌橙/暖色系，深浅双主题），间距用 4px 基准栅格。
- **字体**：中文正文 `Noto Sans SC` / `HarmonyOS Sans SC`（系统栈优先，webfont 按需子集化）；代码 `JetBrains Mono`；英文/数字与中文同 font-family 混排，行高 1.75+。
- **文档区**：
  - 正文最大宽度 68ch，段落间距拉开；
  - 侧栏折叠分组（默认收起二级），顶部放面包屑而非深层树；
  - 提示块（callout）用带色左边线 + 浅底，替代上游 `!!! note` 的方块风格；
  - 表格条纹 + 横向滚动容器，避免窄屏溢出。
- **首页**：
  - 全宽 Hero + 渐变/网格背景 + 大标题（clamp 字号）；
  - Bento/卡片网格做能力展示；
  - 动效克制：入场 fade-up、hover 阴影，用 CSS transition / 轻量 motion，不引重动画库。
- **禁止**：默认紫蓝渐变 AI 味、无意义粒子背景、过度圆角+玻璃拟态堆砌。

### 2.4 图片与静态资源处理

- **上游图片**：同步进 `content/docs/img/`，Markdown 内引用路径统一改写为相对路径或 `/docs-img/...`（经 `next/image` 优化）。上游图片路径形如 `/img/...`（绝对路径），必须在转换脚本中重写。
- **优化**：`next/image` + 本地缓存；GIF 教学图保留 GIF（动图是绑定教学的核心信息），不强行转 video。
- **上游视频**：上游用 `video.js`/`video-plyr.js` + 自定义 shortcode 嵌入。转换脚本识别其视频标记，替换为自研 `<Video>` 组件（本地 `<video>` 或 YouTube iframe），禁止照搬上游 JS。
- **首页视觉**：自绘 SVG/截图/WebGL 均可，但不从官网扒图；可用 generate_3d/图像工具生成抽象视觉，或自录 AE 操作截屏。
- **体积控制**：同步时对 >500KB 的图片出警告；CI 里跑一次图片清单，防止上游塞大图拖垮构建。

---

## 3. 上游同步方案

### 3.1 同步对象与范围

同步（CI 只读、可自动覆盖）：
- `src-docs/docs/**/*.md`
- `src-docs/docs/img/**`
- `src-docs/mkdocs.yml`

本地维护（CI 永不触碰）：
- `content/docs/**/*.mdx` 中**已翻译**的文件
- `content/docs/_meta.cn.ts`
- `content/home/**`、`app/`、`components/`、`lib/`、`scripts/`
- `docs/GLOSSARY.md`、`docs/TRANSLATING.md`、`PLAN.md`

### 3.2 同步流水线设计

```
[定时 cron / 手动 workflow_dispatch]
        │
        ▼
1. sparse checkout 上游仓库（只要 src-docs）
        │
        ▼
2. 写入 upstream/（整目录快照）
        │
        ▼
3. 结构 diff：
   - mkdocs.yml nav 变化 → 生成/更新 _meta 草稿 + 报告
   - 新增/删除/修改 md → 写入 sync-report.json
        │
        ▼
4. 内容 diff（针对每个上游 md）：
   - 计算 hash，与 translation-manifest.json 中记录的
     「翻译时所依据的上游 hash」比对
        │
        ▼
5. 分类：
   - 新文件 → 标记「未翻译」，必要时生成英文占位 mdx
   - hash 变化且对应中文文件存在 → 标记 stale（页面顶部插「上游已更新」横幅）
   - 删除 → 报告，不自动删中文文件（人工确认）
        │
        ▼
6. 提交 sync-report + manifest 更新，开 Issue / PR 汇总
```

### 3.3 GitHub Actions 工作流策略

- **`sync-upstream.yml`**
  - 触发：`schedule`（每周一 UTC 02:00）+ `workflow_dispatch`（带可选输入：强制全量）。
  - 步骤：checkout 本仓库 → checkout 上游（sparse）→ 跑 `scripts/sync-upstream.mjs` → 若有变化则 commit 到 `chore/sync` 分支并开 PR（不直接推 main）。
  - PR 内容：sync-report 摘要（新增 X / 变更 Y / 删除 Z / stale W）。
- **`deploy.yml`**
  - 触发：main push + PR 合并。
  - 步骤：`npm ci` → `npm run lint` → `npm run build` → 部署（Vercel / Cloudflare Pages / 自托管 Node，二选一在 Phase 1 定）。
- **权限最小化**：同步 workflow 只需要 `contents: write` + `pull-requests: write`，不给 secrets。

### 3.4 汉化内容与上游更新的冲突处理

核心机制：**manifest 双 hash 追踪**

`translation-manifest.json`（本地维护，CI 只追加 stale 标记）：

```json
{
  "guide/bones/autorig/leg.md": {
    "upstreamHashAtTranslation": "abc123",
    "status": "translated | partial | untranslated | stale",
    "lastTranslated": "2026-10-28",
    "translator": "agent-human"
  }
}
```

规则：
1. **已翻译文件永不被上游覆盖**。上游变更 → 只在 manifest 标 `stale`，页面顶部渲染「此页上游已更新，译文可能滞后」提示 + 链接到上游原文。
2. **未翻译文件**：CI 可直接用上游新版英文覆盖占位文件（因为没有人工投入）。
3. **译者处理 stale**：拉最新上游段落 → 人工/agent 重译变更部分 → 更新 manifest hash → 清除 stale。
4. **结构性变更**（文件改名/目录重排）：同步脚本检测 mkdocs.yml nav 的路径 diff，输出「重命名映射建议」，由人工确认后批量 `git mv` 中文文件。
5. **不做的**：不自动 merge 中英到同一文件、不自动删除疑似废弃的中文页。

### 3.5 同步/本地维护文件速查

| 类型 | 文件 | 策略 |
|---|---|---|
| 同步 | `src-docs/docs/**/*.md` → `upstream/docs/` | CI 快照 |
| 同步 | `src-docs/docs/img/**` → `content/docs/img/` | CI 复制（图片无翻译问题） |
| 同步 | `src-docs/mkdocs.yml` → `upstream/mkdocs.yml` | CI 快照 |
| 派生 | `_meta.ts`（英文结构） | 脚本从 mkdocs.yml 生成 |
| 本地 | `_meta.cn.ts`（中文标题） | 人工维护，结构变化时脚本提示补缺 |
| 本地 | `content/docs/**/*.mdx` | 翻译产出 |
| 本地 | `content/home/**`、`components/home/**` | 站点自有 |
| 不同步 | 上游 `style.css`、`video.css`、`*.js` | 弃用，用自有主题/组件替代 |

---

## 4. 站点信息架构

### 4.1 首页区块类型（名称 + 作用，不含文案）

| # | 区块 | 作用 |
|---|---|---|
| 1 | Hero | 一句话定位 + 主 CTA（进入文档/下载官方版）+ 视觉主图 |
| 2 | 产品是什么（What is） | Duik Ángela 是什么、解决什么问题，配关键截图 |
| 3 | 能力矩阵（Feature Grid） | 绑定/控制器/自动化/动画工具/相机 等核心能力卡片 |
| 4 | 快速上手路径（Onboarding） | 三步：安装 → 入门指南 → 经典教程，链到对应文档页 |
| 5 | 版本与平台（Version Bar） | 当前对应上游版本（v17.1.x）、AE 兼容性、协议（GPLv3） |
| 6 | 本站说明（About this site） | 非官方中文站声明、同步状态、上游致谢与链接 |
| 7 | Footer | 协议（GFDL 文档 / GPLv3 软件）、上游链接、GitHub、联系方式 |

### 4.2 文档导航映射（mkdocs → Nextra）

上游 nav 已确认含 5 大顶层组。映射规则：

| 上游组 | Nextra 顶层 section | 说明 |
|---|---|---|
| `v17.1.x`（Home/Angela/Tutorials/Printed Guide） | `docs/index` + `docs/start` | 首页类内容压平，不做版本侧栏组 |
| `User Guide` | `docs/guide/**` | 主体，保留 bones/constraints/controllers/automation/animation/camera/tools 子分组 |
| `Advanced` | `docs/advanced/**` | API、快捷键、贡献、性能 |
| `F.A.Q.` | `docs/faq` | 单页 |
| `...`（Glossary/Changelog/Credits/License） | `docs/misc/**` | 参考区 |

映射实现：
- `scripts/mkdocs-to-nextra.mjs` 解析 `mkdocs.yml` nav → 自动生成 `_meta.ts`（英文标题，保证结构永远跟得上）。
- 生成 `_meta.cn.ts` 骨架（缺中文标题时 fallback 英文），译者按文件补中文标题。
- 上游 nav 中的**外链项**（API reference `duik.rxlab.io`、Translation、Contact、Chat、Donate、Contribute）→ 转成 `_meta` 中的 external link 项，或收进 footer/「相关链接」分组，不生成本地路由。
- 上游 `use_directory_urls: false` + mkdocs 的 `index.md` 约定 → Nextra 里 `index.mdx` 即目录页，路由脚本需把 `xxx/index.md` 规范化为 `xxx.mdx` 或 `xxx/index.mdx`（选定一种，建议后者，与上游目录树一致）。

### 4.3 首页与文档区跳转关系

- Hero 主 CTA → `/docs`（文档首页）；次 CTA → 官方下载页（外链）。
- 能力矩阵卡片 → 对应文档分区（如「自动绑定」→ `/docs/guide/bones/autorig`）。
- 快速上手路径 → `/docs/getting-started/install` 等具体页。
- 文档区侧栏顶部 → 「← 返回首页」；文档页底部 → 「上一篇/下一篇」+ 「在 GitHub 上编辑此页」。
- 文档搜索（Nextra 内置）仅覆盖文档区，不搜首页。

---

## 5. 汉化与资源本地化策略

### 5.1 Markdown 汉化流程

```
上游 md（upstream/ 快照）
   │  md-convert.mjs（语法适配，见 5.2）
   ▼
结构就绪的英文 mdx（占位）
   │  译者/agent 翻译（按 TRANSLATING.md 规范）
   ▼
中文 mdx（content/docs/）
   │  更新 translation-manifest.json
   ▼
人工抽查 → 合并
```

- 单文件为最小翻译单元；按目录批次推进（先 `getting-started`，再 `guide/bones`，依此类推）。
- 翻译产出必须过一遍「术语表一致性」检查（脚本可查 GLOSSARY 中术语是否按规则出现）。
- 每篇翻译在 manifest 登记，作为 stale 判断基准。

### 5.2 图片/链接重写规则

`scripts/md-convert.mjs` 的固定重写规则：

1. **图片绝对路径**：`/img/xxx.png` → `/docs-img/xxx.png`（或相对路径），并校验文件存在。
2. **站内链接**：指向 `.md` 的链接 → 去掉 `.md`、改为 `/docs/...` 路由形式。
3. **外链**：`duik.rxlab.guide` / `duik.org` 保留，加 `target=_blank`；`rxlab.info` 系列联系/捐赠链接保留。
4. **admonition**：`!!! note` / `!!! warning` 等 mkdocs 语法 → Nextra `<Callout>` 组件（type 映射：note→info、warning→warning、danger→error、tip→success）。
5. **META 行**：删除行尾 `![META](authors:...;license:...)` 行，改为文件顶部 frontmatter（`authors`、`license: GFDL-1.3`、`updated`）——保留元数据但不进正文。
6. **属性列表**：`{: target="_blank" }` 之类 mkdocs attr_list 语法 → 剥离，链接处理在重写规则里统一做。
7. **脚注/表格**：GFM 兼容，Nextra 原生支持，无需转换，但需验证渲染。
8. **视频标记**：上游 video.js 相关 HTML/shortcode → `<Video>` 组件（Phase 2 先占位，Phase 4 补全源）。

### 5.3 术语与专有名词处理原则

维护 `docs/GLOSSARY.md`（双语对照表，机器可读 JSON + 人读 MD 双份或单 MD 表格）。原则：

- **不译（保留英文）**：产品名 Duik、Ángela、Bassell；AE 专有名词按 Adobe 官方中文版 UI（如「合成」「关键帧」「表达式」「父子级」）；代码/API 名（`Kinematics`、`Effector` 等函数/面板名首次出现保留英文+括注中文）。
- **译（有通行中文）**：rig→绑定、auto-rig→自动绑定、controller→控制器、constraint→约束、IK/FK→反向动力学/正向动力学（首次括注 IK/FK）、keyframe→关键帧、expression→表达式、comp→合成、layer→图层、bone→骨骼、envelop→包络、noodle→面条骨（社区通行，需在术语表确认）。
- **首现规则**：术语首次出现用「中文（English）」，之后可用纯中文；工具/面板按钮名与 AE/Duik 界面截图文字保持一致。
- **歧义仲裁**：术语表为准；术语表没有的，先查 Adobe 官方中文帮助，再查 AE 中文社区通行译法，仍无则「英文（中文描述）」并录入术语表待定标记。
- 术语表变更需在 PR 说明理由，避免同一词多译漂移。

---

## 6. 分阶段实施路线

### Phase 1：跑通最小可用（骨架 + 同步流水线 + 空壳）

- **目标**：仓库可构建、可部署、同步流水线端到端跑通，首页与文档区各有可访问的空壳。
- **关键任务**：
  1. 初始化 Nextra + Next.js App Router 项目（`contentDir=content/docs`）。
  2. 写 `scripts/sync-upstream.mjs`（sparse checkout 拉取 upstream/、复制 img、生成报告）。
  3. 写 `scripts/mkdocs-to-nextra.mjs`（nav → `_meta.ts`）。
  4. 写 `scripts/md-convert.mjs` 最小版（绝对路径图片、META 行、admonition 三类重写）。
  5. `app/page.tsx` 空壳首页（占位 Hero + 几个 section 框）。
  6. 文档区 `[[...slug]]` 渲染，先接通 `getting-started/install` 1 页。
  7. 建 `sync-upstream.yml` + `deploy.yml`，选定部署目标。
  8. 写 `translation-manifest.json` 空表 + GLOSSARY/TRANSLATING 初稿。
- **完成标准**：
  - 本地 `npm run build` 成功；
  - 手动触发同步 workflow，upstream/ 与 img/ 落地并出报告；
  - 首页与 `/docs/getting-started/install` 均可访问渲染；
  - 部署 URL 可打开（内网/公网皆可）。

### Phase 2：文档可阅读（基础汉化 + 导航完整）

- **目标**：文档区结构完整、核心路径可中文阅读。
- **关键任务**：
  1. md-convert 全量跑通所有上游 md（100+ 篇），生成英文占位 + 完整 `_meta`。
  2. 中文导航 `_meta.cn.ts` 补齐。
  3. 翻译核心路径：`getting-started`（约 7 页）→ `guide/bones`（含 autorig 与 tools）→ `guide/constraints` 基础。其余先英文占位 + stale/未译标记。
  4. 首页与文档视觉主题定稿（token、中文字体、callout 样式）。
  5. GLOSSARY 沉淀 50+ 核心术语。
- **完成标准**：
  - 文档侧栏与上游 nav 结构一致（外链处理正确）；
  - `getting-started` + `guide/bones` 主要页面全中文、无术语冲突；
  - 未翻译页面有明确「英文原文」标识；
  - 搜索能命中文档内容。

### Phase 3：首页产品化

- **目标**：首页达到产品站观感，完成 7 大区块，与文档双向导流顺畅。
- **关键任务**：
  1. Hero 视觉定稿（背景、主图/动效、CTA）。
  2. 能力矩阵卡片 + 图标/截图。
  3. 快速上手路径、版本条、本站说明、Footer 完整实现。
  4. 响应式与深浅主题、基础 SEO（title/description/OG/结构化数据）、sitemap、`hreflang` 预留。
  5. 性能：图片优化、字体子集、LCP < 2.5s。
- **完成标准**：
  - 移动端/桌面端均无布局破损；
  - Lighthouse（Perf/SEO/A11y）≥ 90；
  - 首页→文档→返回首页的路径无死链。

### Phase 4：持续同步与优化

- **目标**：同步机制无人值守、翻译覆盖率持续提升、体验打磨。
- **关键任务**：
  1. 定时同步转常态（周报 Issue：stale 数、覆盖率）。
  2. 翻译推进：`guide/automation`、`guide/animation`、`guide/camera`、`guide/controllers`、`advanced`。
  3. stale 页批量复译流程固化（agent 辅助 diff 重译）。
  4. 视频组件接入真实源；GIF/图注补充；术语表扩到 150+。
  5. 站内反馈入口（每页「报错/建议」链到 GitHub Issue 模板）。
  6. 结构性变更演练：模拟上游 nav 变更，验证 rename 映射与 stale 流程。
- **完成标准**：
  - 同步 workflow 连续 4 周自动运行无人工救火；
  - 翻译覆盖率 ≥ 80%（按 nav 页数计），stale 页 100% 有提示；
  - 上游结构变更演练通过。

---

## 7. 风险与约束

### 7.1 上游结构变更风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 上游改目录/文件名 | 路由与翻译映射断裂 | mkdocs.yml nav diff 作为唯一结构真相；rename 映射脚本 + 人工确认 `git mv` |
| 上游删页 | 中文残留死链 | 删除不自动删中文页，报告人工确认 |
| 上游改语法（视频/短代码） | convert 脚本失效 | convert 脚本带「未知语法」告警，报告未识别模式 |
| 上游停止维护 | 内容冻结 | manifest 记录最后同步版本，站点标注「对应上游 v17.1.x」 |
| 上游改协议 | 合规风险 | 同步时检测 `doc-license.md` 变化，变动即开 Issue |

### 7.2 开源协议注意点（重要，先读）

- **软件**：Duik 本体 GPLv3。本站不打包、不改代码、不宣称官方；仅提供指向官方下载与文档的链接，无 GPL 传染问题。
- **文档**：上游文档为 **GNU Free Documentation License 1.3**（`misc/doc-license.md`）。**翻译属于 FDL 定义的「Modified Version（修改版）」**，合规义务包括：
  1. 中文站整体以 **GFDL 1.3（无 Invariant Sections / 无 Cover Texts）** 发布译文；
  2. 保留全部上游版权声明；
  3. 为本站的修改（翻译）添加独立版权行与修改者列表；
  4. 明确标注这是基于原文的修改版/翻译版，并说明分发方式；
  5. 不得移除上游的免责声明（Warranty Disclaimers）。
- **落地动作**：站点 Footer + 每篇文档 frontmatter 保留 `license: GFDL-1.3` + 上游作者信息；仓库根放 `LICENSE-GFDL-1.3.md`（文档译文协议）与 `NOTICE.md`（归属与修改声明）；首页「本站说明」区块再次声明非官方与归属。
- **商标/命名**：「Duik」「Ángela」「RxLaboratory」为上游所有，仅作描述性指称，不用于暗示官方背书。
- **图片**：随文档发布的图片同受 GFDL 覆盖，保留 META 元数据里的作者信息（转换时写入 frontmatter）。

### 7.3 明确不建议做的事

1. **不爬官网 HTML**——结构噪声大、不可 diff、协议上也更接近「复制渲染产物」。
2. **不整站机翻后直接上线**——机翻只能作初稿，必须过术语表与人工/agent 审校，否则专业术语错译比英文更误导。
3. **不自动覆盖已翻译文件**——上游更新只标记 stale，永不 `force checkout` 中文 mdx。
4. **不照搬上游 mkdocs 的 JS/CSS**（`style.css`、`video.js`、`collapser.js` 等）——用自有主题与组件替代，减少维护面。
5. **不做安装包镜像/二次分发**——只链官方渠道，避免 GPLv3 分发义务与版本混乱。
6. **不在未确认协议前商用**——文档 GFDL 允许商业分发但义务重；本站定位非商用知识库，若未来商用先做法律确认。
7. **不把个人笔记混进上游内容树**——个人知识库内容放独立分区（如 `content/notes/`），与镜像内容物理隔离，避免污染同步。

---

## 8. 下一步可执行任务清单（按优先级，可直接分配给 agent）

| # | 任务 | 产出 | 依赖 | 优先级 |
|---|---|---|---|---|
| T1 | 初始化 Nextra + Next.js App Router 项目骨架（contentDir、TS、Tailwind/或 CSS Modules、`[[...slug]]` 渲染壳） | 可 `npm run build` 的空项目 | 无 | P0 |
| T2 | 写 `scripts/sync-upstream.mjs`：sparse 拉取上游 `src-docs` → `upstream/`，复制 `img/` → `content/docs/img/`，产出 `sync-report.json` | 同步脚本 + 本地跑通记录 | T1 | P0 |
| T3 | 写 `scripts/mkdocs-to-nextra.mjs`：解析 `mkdocs.yml` nav → 生成 `_meta.ts` + `_meta.cn.ts` 骨架 + 外链清单 | 导航映射脚本 + 生成的 _meta | T2 | P0 |
| T4 | 写 `scripts/md-convert.mjs`（最小版）：图片绝对路径、META 行转 frontmatter、admonition→Callout、.md 链接重写 | 转换脚本 + 20 页转换样例 | T2 | P0 |
| T5 | 建 `translation-manifest.json` 结构 + `docs/GLOSSARY.md` 初稿（50 术语）+ `docs/TRANSLATING.md` 翻译规范 | 汉化基建三件套 | 无 | P0 |
| T6 | 建 `.github/workflows/sync-upstream.yml`（cron + dispatch，开 PR 不直推 main）与 `deploy.yml`（选定 Vercel 或 CF Pages） | 两条 CI 流水线 | T2 | P1 |
| T7 | 首页空壳：`app/page.tsx` + Hero/能力矩阵/快速上手/Footer 区块占位组件（`components/home/`） | 可访问的首页骨架 | T1 | P1 |
| T8 | 翻译试点：`getting-started` 7 页全量翻译 + manifest 登记 + 术语一致性检查 | 首批中文文档可读 | T4,T5 | P1 |
| T9 | 文档主题定稿：设计 token、中文字体栈、Callout/表格/侧栏样式、深浅主题 | 文档区视觉基线 | T1 | P1 |
| T10 | 协议合规落地：`LICENSE-GFDL-1.3.md`、`NOTICE.md`、Footer 归属声明、首页「本站说明」区块 | 合规文件齐备 | T7 | P1 |

> 建议启动顺序：T1 →（T2/T5 并行）→（T3/T4/T10 并行）→（T6/T7/T9 并行）→ T8。T1–T5+T10 完成即达成 Phase 1 的 80%。

---

## 附：关键路径速查（来自上游实测）

- 上游 nav 顶层组：`v17.1.x` / `User Guide` / `Advanced` / `F.A.Q.` / `...`（Glossary/Changelog/Credits/License）
- User Guide 子域：`getting-started`、`guide/rigging`、`guide/oco`、`guide/bones`(+autorig/+tools)、`guide/constraints`(+tools)、`guide/controllers`(+tools)、`guide/automation`(+tools)、`guide/animation`(+tools)、`guide/camera`(+tools)、`guide/tools`(composition/layers/text/scripting)、`guide/cmd`、`guide/notes`、`guide/sanity`、`guide/settings`
- 外链（不建本地路由）：`http://duik.rxlab.io`（API reference）、`http://translate-duik.rxlab.io`、`contact/chat/donate/contribute.rxlab.info`
- 上游 docs 根目录额外文件（不同步进内容树）：`style.css`、`video.css`、`video.js`、`video-plyr.js`、`collapser.js`、`meta.js`
- 图片目录：`src-docs/docs/img/`
- 文档协议：`misc/doc-license.md` → **GNU FDL 1.3**；软件协议：`misc/gnu-gpl.md` → **GNU GPLv3**
