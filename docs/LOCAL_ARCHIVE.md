---
关联文档:
  - ../README.md
  - ./LANDING_REDESIGN_PLAN.md
  - ./BRAND_GUIDE.md
  - ./CHARACTER_RIG_TEST.md
涉及文件:
  - package.json
  - next.config.mjs
  - .gitignore
依赖服务:
  - duik-zh 本地 Next.js 预览（127.0.0.1:3017）
---

# 本地过时文件归档 · 2026-11-06

按用户要求先整理本地文件，暂停推送部署。本批不永久删除、不改写 Git 历史，也不清理独立的 `web-clone` 仓库或中央 Skills。

## 恢复位置

本机归档：`/Users/tanyancong/工作/开发/duik-zh-local-archive/20261106-I7vTHX/`。

- `manifest.json`：移动前清单、来源提交 `44efc8965323571fab5be6ff7ceac0f4064c49df`、每项文件数/字节数/目录树 SHA-256，以及保留对象的哈希。
- `files/`：按原始仓库相对路径保存全部归档文件。
- `verification.json`：移动后的完整性和保留对象核对结果。
- `README.md`：恢复步骤。目标不存在时才移回；已有新文件时先比较、另存，不能覆盖。

归档仅在本机，未上传。历史文档的 `output/<name>`、`.playwright-cli/`、`.impeccable/review/` 和 `skills/character-rig-lab-workspace/` 证据路径，可在 `files/` 下按原相对路径查找。若工作区重新生成同名报告，应按日期/哈希区分，不能把旧报告当本轮验收。

## 本批归档

共 350 个文件或目录入口，内含 1,045 个文件，116,957,870 字节（约 111.5 MiB）；其中 98 个文件原由 Git 跟踪，其余为未跟踪或忽略的本地产物。

| 范围 | 处理 |
| --- | --- |
| `components/home/landing/candidate/`、候选发布/测试脚本及 `public/duik-candidate/`、`public/landing-candidate.html` | 已放弃的独立候选路线整套归档，移除 `landing:candidate` 命令；旧地址永久跳回 `/` |
| `skills/character-rig-lab-workspace/` | 已完成的 iteration-1 评测副本归档，不是共享 Skill 实现 |
| 历史 `output/` 截图、日志、试稿、独立验证与重复导出 | 保留原字节归档，包含旧 `landing-before-light` 恢复副本；当前完整 `baseline/` 不动 |
| `.playwright-cli/`、`.impeccable/review/`、根目录散落截图 | 仅历史页面快照/截图，无配置或会话数据库 |
| `docs/logo-studies-archive-2026-11-05.tar.gz` | 原恢复包完整保存在 `files/docs/`；四案、原始参考与归属仍可恢复 |

这是同卷移动，不代表释放了 111.5 MiB 磁盘空间。没有清空废纸篓或删除恢复点。

## 明确保留

- `components/home/landing/baseline/`：发布器确定性输入，不是可以删除的旧模板。
- 当前 `/`、`/docs`、`/rig-test.html`、`/rig-embed.html`、`/brand.html` 及全部依赖；批准的 26 层角色、原图、旧图层与来源记录保留。
- `skills/character-rig-lab/`：共享绑定核心、生成器与工作台实现。
- `output/riglab-demo/`：`scripts/build-character-rig.py` 正在使用的角色编辑项目（含恢复备份）；`output/rig-tools-env/`：本地制作环境。不能把整个 `output/` 当缓存。
- `output/docs-media-2026-11-06/`、`output/brand-perf-2026-11-05/` 与已跟踪的四份验收记录：近期交付证据保留在原位。
- 官方文档图片、译文、`upstream/`、许可证/NOTICE、锁文件、Git 历史、独立 `web-clone` 模板库和中央 Skills。
- `site/`：早期采集快照，当前仅约 12 KiB 元数据实际落盘，其余是 sparse 省略。本批不把“未落盘”误判为缺文件，也不扩大为 Git 快照清除。当前发布从 `baseline/` 读取，不从 `site/` 运行。

## 验证

- 350 项归档的目录树 SHA-256 全部匹配，所有原路径已移出；9 组受保护对象哈希不变。
- `git diff --check` 通过；定向文档媒体/路由/品牌测试 20 通过、1 项 HTTP 未配置跳过，恢复服务后该文档套件真实 HTTP 重跑 3/3 通过、无跳过。
- `npm run build` 退出 0，137/137 页；531 个本地文档图片引用无缺失。保留既有多锁文件和浅克隆提示，不清理父目录锁文件。
- 本仓库 `npm run dev -- --hostname 127.0.0.1 --port 3017` 已恢复；首页、文档、品牌、工作台、嵌入页、运行模块和 26 张角色层共 37 个本地请求返回 200。旧候选地址返回 308 到 `/`。
- 本轮证据：`output/local-cleanup-2026-11-06/acceptance.json`；归档完整性证据在归档根的 `verification.json`。

这些检查只证明本次清理边界，不代表重新验收全页动画、AE 实机或线上部署。53 个官方旧视频失效状态未在本任务修复。
