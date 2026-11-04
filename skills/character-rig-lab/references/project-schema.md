# 数据化角色配方

项目包含 `source.png`、`project.json`、构建后的 `rig/`。无需复制 Skill 的程序。使用 `init --source` 创建新的待标注项目，修改该项目 JSON 而非运行时。完整已验证例子在 `assets/demo/project.json`。

## 必填字段

- schemaVersion=1，profile=upper-body-2d-v1；固定骨顺序见 scripts/project_schema.py。
- source：项目内相对 PNG 路径；sourceSha256：已确认源图文件哈希；canvas：[宽, 高]。
- layers：26 个语义层，顺序也是默认合成顺序。每层有 id、label、group、polygon、bone、pivot。所有坐标均为源图像素。后标注的多边形拥有重叠处像素；ownershipOverrides 处理明确的局部层级覆盖。
- joints：root/body/neck/head，以及 l/r 两组 shoulder/elbow/wrist。肘部静态方向决定 IK 的默认弯曲方向。
- mesh：采样步长、躯干/四肢权重模糊半径、奇数重叠核。共享网格确保切口两边使用同一个变形场；这与独立旋转矩形裁片不同。
- camera：[x,y,width,height]，明确舞台取景。
- hairFields：center、radius、vector、control；数据化发束局部变形场。
- faceSupport：skinPolygon、crop、bbox、eyeColor；只从当前原图邻近皮肤纹理补底，眼白使用明确颜色。不要把它称为真实隐藏素材。
- controllers：外围控制器的原图坐标。可省略单个位置使用默认比例，但新角色建议明确标注。
- motionLimits：头、身体、手腕、发束的角度限制，手部目标半径及 rootX/rootY 平移限幅。放宽前需要新的动态证据和遮挡补绘。

## 构建输出

rig.json 的每个部件包含 bbox、visualBBox、PNG/thumbnail 路径、枢轴、父骨和三角形索引。vertices 是共享源图坐标及按 bones 顺序排列的权重。所有资源路径相对于 rig.json；相同产物可以服务在 Nextra 或独立 Python 服务中。

build 先检查源图锁定与必填语义标注，在临时目录完成构建后才替换生成目录；旧 rig 保存为 rig.previous-*。目录没有生成标记时拒绝覆盖。init 不覆盖现有非空目录。

## 新图片安全分支

新图初始化会清空所有多边形、枢轴、骨骼位置和补底范围，保持“待标注”。直接 build 应明确失败而不是偷偷给它绑定示例人体。这是身份与对齐安全检查，不是缺少素材时的静默降级。

本版 profile 固定为 26 层上半身；多角色、全身、多视角或任意数量图层需要新 profile 和对应测试，不能只改层数冒充已支持。
