import {element,ensureVisualStyles,sceneImage} from './visual-scenes.mjs';

const steps=[
  {image:'layers',alternate:null,label:'拆层与骨骼',detail:'26 张透明图层 · 原坐标对齐'},
  {image:'ik',alternate:null,label:'绑定与约束',detail:'用手部目标理解 IK 与关节联动'},
  {image:'animation',alternate:null,label:'进入动画',detail:'从关键姿势开始，继续打磨角色表演'}
];

/** Keeps the copied parent's Lottie-facing API and original scroll/Swiper timing.
 * Only the old AI-generation visual is replaced; this is not a rig engine. */
export const Vue3Lottie={
  name:'DuikWorkflowVisual',inheritAttrs:false,
  props:['animationLink','loop','autoPlay','width','height','renderer'],
  emits:['onAnimationLoaded','onComplete'],
  data(){return {step:0,playing:false,completionTimer:null};},
  mounted(){ensureVisualStyles();this.$emit('onAnimationLoaded');},
  beforeUnmount(){this.stop();},
  methods:{
    playSegments(segment){
      clearTimeout(this.completionTimer);
      this.step=segment[0]>=615?2:segment[0]>=420?1:0;this.playing=true;
      const duration=Math.max(1,(segment[1]-segment[0])/60*1000);
      this.completionTimer=setTimeout(()=>{this.playing=false;this.$emit('onComplete');},duration);
    },
    stop(){clearTimeout(this.completionTimer);this.completionTimer=null;this.playing=false;},
    goToAndStop(frame){this.stop();this.step=frame>=615?2:frame>=420?1:0;}
  },
  render(){
    return element('div',{class:'duik-workflow-visual',style:{width:'100%',height:'100%'},
      'data-duik-workflow-step':this.step,'data-playing':String(this.playing)},[
      element('div',{class:'duik-visual-topline'},[
        element('span',{class:'duik-visual-label'},'同一角色 · 绑定流程'),
        element('span',{class:'duik-visual-note'},'网页流程示意')
      ]),
      element('div',{class:'duik-workflow-scenes'},steps.map((step,index)=>
        element('figure',{key:index,class:'duik-workflow-scene','data-active':String(index===this.step),'aria-hidden':String(index!==this.step)},[
          element('div',{class:'duik-workflow-art'},[
            sceneImage(step.image,step.alternate?'duik-workflow-primary':''),
            ...(step.alternate?[sceneImage(step.alternate,'duik-workflow-alternate',{'aria-hidden':'true'})]:[])
          ]),
          element('figcaption',{class:'duik-workflow-caption'},[
            element('span',{class:'duik-scene-index'},String(index+1).padStart(2,'0')),
            element('span',null,[element('strong',null,step.label),element('span',null,step.detail)])
          ])
        ])
      )),
      element('div',{class:'duik-workflow-dots','aria-hidden':'true'},steps.map((_,index)=>
        element('span',{key:index,'data-active':String(index===this.step)})
      ))
    ]);
  }
};
