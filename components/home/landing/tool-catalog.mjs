/** Documentation navigation, not a browser implementation of the AE commands. */
export const upstream = Object.freeze({
  repository: 'RxLaboratory/Duik',
  commit: '718e6e282d1ae91dc9678bb1a202ce08e862a28d',
  source: 'src-docs/docs/getting-started/first-look.md',
});

export const panels = Object.freeze([
  { id: 'bones', title: '骨骼', english: 'Bones', icon: 'bone', href: '/docs/guide/bones', summary: '创建或使用预设骨架，以 AE 形状图层组织结构，再关联美术与自动绑定。' },
  { id: 'constraints', title: '链接与约束', english: 'Links and constraints', icon: 'constraints', href: '/docs/guide/constraints', summary: '让图层、属性与关节按照明确的关系运动。' },
  { id: 'controllers', title: '控制器', english: 'Controllers', icon: 'controller', href: '/docs/guide/controllers', summary: '把复杂结构收拢到便于选择、调整与制作动画的控件。' },
  { id: 'automation', title: '自动化与表达式', english: 'Automation & expressions', icon: 'automation', href: '/docs/guide/automation', summary: '设定程序化运动规则，减少重复添加关键帧。' },
  { id: 'animation', title: '动画', english: 'Animation', icon: 'animation', href: '/docs/guide/animation', summary: '处理关键帧、插值、补间与动画库，继续打磨动作节奏。' },
  { id: 'camera', title: '摄像机', english: 'Camera', icon: 'camera', href: '/docs/guide/camera', summary: '在角色之外，组织场景的镜头运动与构图。' },
  { id: 'tools', title: '通用工具', english: 'Tools', icon: 'tools', href: '/docs/guide/tools', summary: '合成、图层、文本与脚本：让 After Effects 日常操作更顺手。' },
  { id: 'command', title: '命令行与功能库', english: 'Command Line and Feature Library', icon: 'cmd', href: '/docs/guide/cmd', summary: '在 AE 的 Duik 命令行面板查找功能。这里的检索只打开文档。' },
]);

export const toolGroups = Object.freeze([
  { id: 'composition', title: '合成', english: 'Composition' },
  { id: 'layers', title: '图层', english: 'Layers' },
  { id: 'text', title: '文本', english: 'Text' },
  { id: 'scripting', title: '脚本与表达式', english: 'Scripting & Expressions' },
]);

// The index is deliberately curated. It is not a claim to enumerate every command.
const entries = [
  ['create-bones', 'bones', '创建骨骼', 'Create Bones', '为角色各部分准备骨骼结构。', '/docs/guide/bones/create-bones', '骨架 结构 armature'],
  ['auto-rig', 'bones', '自动绑定', 'Auto-rig', '按肢体结构理解自动绑定流程。', '/docs/guide/bones/autorig', '绑定 rig IK'],
  ['link-art', 'bones', '链接图形', 'Link Art', '将美术图层和 Duik 图钉父子链接到骨骼。', '/docs/guide/bones/tools/link-art', '图层 素材 父子 art'],
  ['envelops', 'bones', '包络', 'Envelops', '用完整骨骼自带的参考图形，辅助设计肢体关节。', '/docs/guide/bones/envelops', 'envelope 关节 参考'],
  ['kinematics', 'constraints', '动力学与 IK / FK', 'Kinematics', '理解关节链与控制器之间的运动关系。', '/docs/guide/constraints/kinematics', '反向动力学 正向动力学 关节'],
  ['parent', 'constraints', '父子约束', 'Parent constraints', '控制图层的父子关联。', '/docs/guide/constraints/parent', 'parenting 父级'],
  ['connector', 'constraints', '连接器', 'Connector', '让属性之间建立驱动关系。', '/docs/guide/constraints/connector', '属性 驱动'],
  ['pins', 'constraints', '图钉', 'Pins', '组织路径与木偶图钉的控制。', '/docs/guide/constraints/pins', 'puppet path 路径'],
  ['create-controller', 'controllers', '创建控制器', 'Controllers', '为需要制作动画的结构准备操作入口。', '/docs/guide/controllers', '控件 controller 创建'],
  ['controller-settings', 'controllers', '控制器设置', 'Controller settings', '调整控制器的显示与组织方式。', '/docs/guide/controllers/tools/settings', '外观 颜色 大小'],
  ['controller-visibility', 'controllers', '显示与隐藏', 'Show / Hide', '在制作动画时切换控制器可见性。', '/docs/guide/controllers/tools/show-hide', 'visible 隐藏'],
  ['controller-extract', 'controllers', '提取控制器', 'Extract controllers', '查阅预合成中的控制器提取流程。', '/docs/guide/controllers/extract', '预合成'],
  ['wiggle', 'automation', '抖动', 'Wiggle', '通过参数驱动属性的抖动。', '/docs/guide/automation/wiggle', '随机 程序化 幅度 频率'],
  ['looper', 'automation', '循环', 'Looper', '让已有动作按照规则继续循环。', '/docs/guide/automation/looper', 'loop 循环动画'],
  ['walk-run', 'automation', '行走与奔跑循环', 'Walk / Run cycle', '了解自动行走与奔跑的参数和准备条件。', '/docs/guide/automation/walk-run', 'walk cycle'],
  ['bake-expression', 'automation', '烘焙表达式', 'Bake expressions', '按需要把程序化结果转为关键帧。', '/docs/guide/automation/tools/bake', 'bake expressions 关键帧'],
  ['interpolation', 'animation', '插值', 'Interpolation', '调整关键帧之间的变化节奏。', '/docs/guide/animation/interpolation', '缓动 ease easing 曲线'],
  ['tweening', 'animation', '补间', 'Tweening', '在已有姿态之间组织中间状态。', '/docs/guide/animation/tweening', '中间帧 tween'],
  ['anim-library', 'animation', '动画库', 'Animation library', '保存、管理并复用动画。', '/docs/guide/animation/anim-library', '预设 library 复用'],
  ['sequence', 'animation', '序列', 'Sequence', '安排图层与动画的时间顺序。', '/docs/guide/animation/sequence', '错帧 时间 排序'],
  ['camera-2d', 'camera', '2D 摄像机', '2D Camera', '为平面场景建立镜头运动。', '/docs/guide/camera/camera-2d', '视差 parallax 场景'],
  ['camera-rig', 'camera', '摄像机绑定', 'Camera rig', '使用控制器组织摄像机。', '/docs/guide/camera/camera-rig', '镜头 rig'],
  ['framing', 'camera', '构图参考线', 'Framing guides', '用参考线辅助画面构图。', '/docs/guide/camera/tools/frame', '安全框 frame'],
  ['crop', 'tools', '裁剪预合成', 'Crop precompositions', '按预合成上的蒙版边界裁剪，并保持它在父合成中的位置。', '/docs/guide/tools/composition/crop', '尺寸 crop 边界', 'composition'],
  ['composition-settings', 'tools', '合成设置', 'Composition settings', '集中调整合成参数。', '/docs/guide/tools/composition/settings', 'comp 参数', 'composition'],
  ['layer-tools', 'tools', '图层工具', 'Layer tools', '创建、命名、标记并组织图层。', '/docs/guide/tools/layers', '管理 标记 分组 命名 layer tag', 'layers'],
  ['rename', 'tools', '重命名', 'Rename', '按需要处理名称文本。', '/docs/guide/tools/text/rename', '命名 批量 rename', 'text'],
  ['search-replace', 'tools', '查找和替换', 'Search and replace', '查找指定文本并进行替换。', '/docs/guide/tools/text/search-replace', '文本 replace', 'text'],
  ['script-library', 'tools', '脚本库', 'Script library', '整理和调用常用脚本。', '/docs/guide/tools/scripting/library', 'scripting library 脚本管理', 'scripting'],
  ['script-editor', 'tools', '脚本编辑器', 'Script editor', '在脚本工具中编辑代码。', '/docs/guide/tools/scripting/script-editor', '代码 jsx ExtendScript', 'scripting'],
  ['edit-expression', 'tools', '编辑表达式', 'Edit expression', '集中处理属性表达式。', '/docs/guide/tools/scripting/edit-expression', 'expression 编辑', 'scripting'],
  ['scriptify-expression', 'tools', '表达式脚本化', 'Scriptify expression', '把表达式整理为可复用的脚本形式。', '/docs/guide/tools/scripting/scriptify-expression', 'scriptify expression', 'scripting'],
  ['command-panel', 'command', '命令行面板', 'Command Line', '按名称和分类查找 Duik 功能。', '/docs/guide/cmd', 'cmd 搜索 命令面板 快捷键 command line'],
];

export const tools = Object.freeze(entries.map(([id, panel, title, english, summary, href, keywords, group]) => Object.freeze({ id, panel, title, english, summary, href, keywords, group })));

export function normalizeQuery(value = '') {
  return String(value).normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function searchTools(query = '', panelId = 'all') {
  const terms = normalizeQuery(query).split(' ').filter(Boolean);
  return tools.filter(tool => {
    if (panelId !== 'all' && tool.panel !== panelId) return false;
    const panel = panels.find(item => item.id === tool.panel);
    const group = toolGroups.find(item => item.id === tool.group);
    const haystack = normalizeQuery([tool.title, tool.english, tool.summary, tool.keywords, panel.title, panel.english, group?.title, group?.english].join(' '));
    return terms.every(term => haystack.includes(term));
  });
}

export const apiExamples = Object.freeze([
  { id: 'arm', title: '手臂绑定', call: 'Duik.Rig.arm();', prerequisite: '先选择符合手臂结构的骨骼，再调用手臂自动绑定。', href: '/docs/advanced/api/duik-features', source: 'src-docs/docs/advanced/api/duik-features.md' },
  { id: 'wiggle', title: '属性抖动', call: 'Duik.Automation.wiggle();', prerequisite: '先在 After Effects 中选择要添加抖动的属性。', href: '/docs/advanced/api/duik-features', source: 'src-docs/docs/advanced/api/duik-features.md' },
  { id: 'auto-parent', title: '自动父子关联', call: 'Duik.Constraint.autoParent();', prerequisite: '先选择需要关联的图层；示例使用最后选中的图层作为父级。', href: '/docs/advanced/api/headless-scripts', source: 'src-docs/docs/advanced/api/headless-scripts.md' },
]);
