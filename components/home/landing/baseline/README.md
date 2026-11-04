# 首页适配基线

这里保存本轮 Duik 首页适配之前的本地模板快照（包含此前已确认的 Hero 文案改动）。
它是 `scripts/publish-duik-landing.mjs` 的确定性输入，不是运行目录。

- 不在这些文件里继续替换文案；维护 `content.mjs`、组件与发布转换。
- `npm run landing:publish` 从基线同步 HTML、序列化数据和限定的运行模块。
- 原有 `output/landing-before-light/` 只作本次工作区恢复副本；提交首页时必须包含本目录。
- `public/` 是可直接由 Next 服务的产物；不访问在线镜像。
- 上游模板标识、许可和来源应保留在仓库原有来源说明中；产品文案不冒充官方。
