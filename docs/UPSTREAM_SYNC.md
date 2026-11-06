---
关联文档:
  - ../AGENTS.md
  - ../README.md
  - ../PLAN.md
  - ./TRANSLATING.md
  - ./GLOSSARY.md
  - ./DOCS_MEDIA_DELIVERY.md
  - ./GITHUB_PAGES.md
涉及文件:
  - .github/workflows/sync-upstream.yml
  - .github/workflows/deploy.yml
  - .gitattributes
  - scripts/lib/upstream-sync.mjs
  - scripts/lib/translation-batch.mjs
  - scripts/refresh-upstream-snapshot.mjs
  - scripts/sync-upstream.mjs
  - scripts/translation-batch.mjs
  - scripts/md-convert.mjs
  - translation-manifest.json
  - translation-queue.json
  - sync-report.json
依赖服务:
  - GitHub Actions
  - GitHub API（RxLaboratory/Duik 与 yancongya/duik-zh）
---

# 上游检查与本地 Codex 续译

更新日期：2026-11-06，北京时间；本轮修改基于 `173513f`。

已按用户选择实现：**CI 只检测、生成任务和提同步 PR；本地 agent 按批次增量翻译与审校，再显式应用。** 默认使用本地 Codex，也可交给其他 agent 软件；工具链不绑定模型厂商，不在 CI 自动写中文或调用模型 API，不自动合并。2026-11-06 用户已授权本次提交、推送及 Pages 部署；实际发布版本与结果以 [Pages 运行记录](https://github.com/yancongya/duik-zh/actions/workflows/deploy.yml) 和线上 `pages/build-info.json` 为准。**部署网站不会主动执行上游同步**，其首次真实运行和历史快照恢复仍需单独验收。

## 1. 执行边界

| 环节 | 本地实现 | 尚未完成的远端动作 |
| --- | --- | --- |
| 手动检查 | 保留 `workflow_dispatch`，移除无效 force 输入 | 发布后运行一次新版入口 |
| 定时检查 | 保留每周一 UTC 02:00（北京时间 10:00） | 新版配置发布后才生效；实际启动可能延迟 |
| 事件检查 | 新增 `repository_dispatch: duik-docs-updated`，不消费 payload 中的仓库、版本或命令 | **未配置官方事件发送端**，不等于官方每次 push 都会即时触发 |
| 固定快照 | 始终检出官方 `RxLaboratory/Duik` 的 master，记录实际完整 commit；按 Git blob 校验字节 | 首次新版 CI 恢复历史损坏快照，并由维护者审查同步 PR |
| 差异与任务 | 新增/变更/删除/恢复/同内容改名候选、翻译基线、当前中文摘要、任务包 | 在 Actions artifact 中确认真实产物 |
| 继续翻译 | 本地隔离目录产出译稿与审校记录，`check` 只读，`apply` 显式写回 | **没有无人值守本地唤醒器**；将批次交给当前本地 Codex 接续 |
| 构建与发布 | 同步候选有变动时，在提 PR 前执行安全回归与 Pages 构建；main 合并后沿用独立 Pages 流程 | Pages 按本次 SHA 核查；同步候选的 PR 前构建仍待首次真实同步验收 |

`npm run sync` 和 `sync:check` 只分析现有快照，不下载官方更新。`upstream/` 只由专用 CI 更新，本地脚本可通过只读 Git 对象补足稀疏省略的快照文件。不要用本地快照盘点代替“已查询官方最新版本”。

## 2. 日常使用

只盘点、不改记录：

~~~bash
npm run sync:check
~~~

基于已获取的快照更新本地 manifest、稳定报告和待译队列，然后生成一批任务：

~~~bash
npm run sync
npm run translate:prepare -- --batch=output/upstream-sync/batch-2026-11-06 --limit=5
~~~

每批默认 5 篇，上限 20 篇；可增加 `--path=guide/bones/index.md` 定向选择当前待译页。目录必须全新，不覆盖正在处理的批次。仓库内批次只允许放在 `output/upstream-sync/`，该目录不提交；其他 `output/` 内容不受影响。

批次内容：

~~~text
batch-…/
  batch.json        # ready tasks、blocked原因、来源与当前中文摘要
  PROMPT.md         # 交给本地Codex的执行说明
  source/           # 当前官方原文副本
  baseline/         # 翻译时原文，按Git历史和登记hash查找
  current/          # 当前中文副本
  rules/            # TRANSLATING.md、GLOSSARY.md
  drafts/           # 本地Codex后续生成的中文MDX
  review.json       # 后续独立审校结论
~~~

给本地 Codex 的任务可以是：

> 读取这个批次的 PROMPT.md、batch.json 和规范，只处理 ready 项。新增页生成中文 MDX，更新页只修改源文真实变化段。保留无关译文、代码、媒体链接和归属；在 drafts/ 生成后独立审校并记录 review.json，先运行 translate:check。不要自动 apply、commit、push 或部署。

下载 CI artifact 后，使用它在本机的实际目录，不能复用 CI 的绝对路径。**本地必须先具备同一同步候选的快照、版本记录与翻译基线**：先审查同步 PR，再检出或合入获批的候选；不要手工复制 artifact 的 source/ 覆盖 `upstream/`。本地来源和批次不一致时检查会拒绝，重新生成批次即可。

每篇审校记录必须绑定最终译稿的 SHA-256：

~~~json
{
  "reviews": [{
    "path": "guide/bones/index.md",
    "decision": "approved",
    "translator": "本地译稿代理",
    "reviewer": "独立审校者",
    "notes": "记录变更范围、术语、含义、代码、链接与版权核对结论",
    "draftSha256": "最终MDX的完整SHA-256"
  }]
}
~~~

有真实审校结论后检查；只有获准写回时执行 `apply`：

~~~bash
npm run translate:check -- --batch=output/upstream-sync/batch-2026-11-06
# 以下会修改正文和manifest，不是预览命令
npm run translate:apply -- --batch=output/upstream-sync/batch-2026-11-06
npm run sync
npm run docs:media
node --test scripts/test-docs-navigation.mjs scripts/test-docs-shell.mjs
npm run build
~~~

构建不要与现有 dev 共写 `.next`；使用独立检出/构建副本，或先有序停服并在结束后恢复。`apply` 不执行构建、提交、推送或合并。技术检查不能替代语义审校，也不能证明新增媒体已经本地化；仍须检查实际 diff、媒体与导航。

### 2.1 交给其他 agent 软件

这套批次是普通 Markdown、MDX、JSON 和 Node CLI，不依赖 Codex 会话、私有接口或特定 Skills。其他软件具备读写项目文件和执行 Node 22/Git 命令的能力即可接续；不能执行命令的软件只能提供译稿，由具备环境的维护者完成审校、检查和应用。

1. 打开同一仓库的最新已发布版本；换电脑时保留完整 Git 历史，使用锁文件安装依赖。先读取 `AGENTS.md`、本文件、`TRANSLATING.md`、`GLOSSARY.md`。软件不自动发现 AGENTS 时，在任务中显式要求读取。
2. 沿上节生成或下载批次，只分配 ready 中明确的一组文件；不同软件使用不同批次目录，不能同时改同一篇正文或 manifest。编辑时复用官方快照，角色/落地页不在翻译任务范围。
3. 译稿与审校结论分开进行，真实填写 translator/reviewer，不伪造人工审核身份。运行 `translate:check`；获准后 `translate:apply`，再运行同步、媒体、导航、普通构建和 Pages 检查。
4. 提交只包含本批明确文件和必要的 manifest/导航/媒体记录，不包含批次目录、密钥或 `output/riglab-demo/`。获得此次提交/推送授权后，可走翻译分支 PR；PR 只构建，审查合入 main 后才发布。若用户明确允许直接推 main，同样先通过检查，并确认没有遗漏的他人提交；不要强推。
5. 推送后核对对应 SHA 的 Pages Actions 和线上构建记录，不能只凭 `git push` 成功宣称部署完成。其他软件无需另建部署脚本，也不用重新配置 Pages。GitHub 写权限使用现有登录；凭据若需管理，遵守 AGENTS 的 bwvault 规则，不写进提示词或仓库。

可复制给其他 agent 的任务：

> 先读取 AGENTS.md、docs/UPSTREAM_SYNC.md、docs/TRANSLATING.md 和 docs/GLOSSARY.md。使用现有 translate:prepare/check/apply 流程，只处理本批 ready 任务，保留无关译文、代码、链接和归属；先生成 drafts 并独立审校，不直接覆盖正文。完成技术检查后汇报；应用、提交、推送按我在本次任务中的明确授权执行。不要修改上游快照或落地页，不要自动合并 PR。

## 3. 安全保护与异常处理

- **字节与路径。** `.gitattributes` 对 `upstream/**` 使用 `-text`，禁止 Git 自动改换行；CI 在替换前逐文件校验原始 blob。两条 CLI 使用 `fileURLToPath`，支持中文路径。空快照、路径穿越、符号链接或不完整来源失败退出。
- **译文不被占位覆盖。** 转换器无 `--force`；已有文件、Git index 已追踪文件及已登记翻译全部跳过。稀疏省略/本地删除的中文不能被当成“新页”；批次会阻断，先区分 skip-worktree 与真实删除，不自动重建。
- **真实翻译基线。** stale 由 `upstreamHashAtTranslation` 决定，不能因上次已刷新快照就漏掉未续译内容。历史原文找不到时进入 blocked，核实前不全篇盲译、不清 stale。删除和改名只报告，不删除或移动中文。
- **双重输入校验。** 检查时同时核对当前仓库与批次中的 source/baseline/current 副本、官方版本、翻译登记及当前中文 SHA-256；并核对 approved 稿 hash。漏文件、改副本、并发改中文或审校后改稿均拒绝应用。
- **不执行译稿。** 元数据只接受独立 `---` 分隔的 YAML core schema，不使用可自动执行 `---js` 的解析器。MDX AST 拒绝新增 import/export、脚本、事件、spread 和执行表达式，保留可核实的既有表达式；代码块须能在当前官方正文找到。该技术门禁不是通用 MDX 沙箱。
- **应用边界。** 所有译稿先通过校验才开始写回；新文件独占创建。应用期间不要让其他进程修改同一批正文。I/O 故障不保证跨文件事务回滚，应停下核对 diff，不直接重跑覆盖。
- **版权和媒体。** 保留已有 authors/copyright/license；官方声明发生真实变化时须单独处理，不绕过校验。媒体和导航变化需要现有专项流程，不自动从快照替换网页素材。课程访问限制不绕过。

`run.checkedAt` 是每次实际检查时间，输出到日志/运行 artifact；`sync-report.generatedAt` 仅在稳定内容改变时更新。这样无变化时不会只因时间戳开噪声 PR。可选 `--output=output/upstream-sync/check.json` 只允许该目录中的 JSON 文件，不可指向正文、登记或符号链接。任务包可能同时含 ready 与 blocked，后者不会进入自动应用。

## 4. 本轮结果与历史问题

2026-11-06 本轮只读官方核查：`718e6e282d1ae91dc9678bb1a202ce08e862a28d`，`src-docs` 最近提交为 2026-02-19 的 `update credits`。两侧快照文件集合均 949 项，132 篇 Markdown 及 `mkdocs.yml` 的 Git blob 一致，没有新的正文或导航变化。这个版本记录是当次证据，不代表日后仍最新。

本地新分析器盘点 132 篇，当前队列为 **0**。六个历史翻译 hash 已逐项证明与同一原文的 CRLF 变体完全相等，因此只归一化登记，并记录 `translationHashMigration.from/to/reason`；未改译文、译者或翻译日期。无法证明只是换行差异的内容不会迁移。

此前快照强制文本规则导致 439 个非 Markdown blob 与官方不同：363 PNG、31 GIF、40 JPG、2 MP4、2 AEP、1 TTF。PNG 抽样官方头 `89504e470d0a1a0a`、旧快照头 `89504e470a1a0a00`，完整样本恰等于 CRLF→LF 损坏结果。**本轮只修保护代码，没有在本地替换 `upstream/`；旧快照恢复须等新版 CI 的同步 PR。** 这些差异不等于线上 439 张图坏掉，同路径 public 媒体抽样正常。

已完成的本地验证：

- `npm run sync:test`：27 项安全/差异/批次回归通过，包括审查新增的稀疏保护、无执行 YAML、输入副本校验及报告输出隔离；新增漏洞先有失败回归，再修复。
- 连续运行同步，manifest、report、queue 字节一致；`content/docs/` 与 `upstream/` 无本轮修改。
- Pages 路径回归 7/7，文档媒体回归 7/7；媒体盘点 531 个本地图片引用，0 缺失。本轮没有重新验证外部视频可用性。
- 隔离副本的 `npm run build` 成功生成 137 页；不与 3017 dev 共写 `.next`。副本无 `.git` 的 Nextra Git 时间警告不影响构建，但不算线上验证。

## 5. 发布与后续验收

本次已获授权发布工作流/脚本/说明，保留现有中文和公共素材；Pages 流程与线上版本按上方运行记录核对。以下上游同步动作不由本次 Pages 部署自动触发：

- [ ] 手动运行一次新版同步，核对完整 SHA、二进制字节、artifact、同步 PR 与 PR 前的真实构建。
- [ ] 审查首次历史快照恢复及版本记录；合并后核对 Pages 发布。后续无差异运行应正常结束，不重复开噪声 PR。
- [ ] 有实际官方变更时，下载任务包并在本地完成一次“续译→审校→check→显式 apply→构建→人工 diff”的真实演练。当前零待译只完成了受控 fixture 演练。
- [ ] 如需官方 push 即时通知，另行配置有权限的事件发送端。当前不为它新增凭据；未来凭据只通过 bwvault 稳定别名管理。

已有远端旧流程的本轮只读核查：`state: active`；最近定时为 2026-11-02 16:34:12（北京时间）启动并成功，检查结果无变化；最近手动为 2026-10-28 15:48:25。历史同步 PR #1 已关闭、未合并，当次未查到开放同步 PR。这些记录不能证明本轮新增代码已经远端执行。

- [定时运行 41414029303](https://github.com/yancongya/duik-zh/actions/runs/41414029303)
- [手动运行 40652452483](https://github.com/yancongya/duik-zh/actions/runs/40652452483)
- [首次手动运行 40646451289](https://github.com/yancongya/duik-zh/actions/runs/40646451289) / [历史同步 PR #1](https://github.com/yancongya/duik-zh/pull/1)

只读查询可用 `gh run list --repo yancongya/duik-zh --workflow sync-upstream.yml --limit 5`。Actions → Sync upstream Duik docs → Run workflow，或 `gh workflow run sync-upstream.yml --repo yancongya/duik-zh --ref main`，**都会触发远端任务**；本轮没有执行。
