import {a as element} from './entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
export default {
  name:'DuikPoseExample',
  render(){return element('div',{class:'duik-pose-slot'});},
  mounted(){
    this.$el.innerHTML='<div class="duik-pose-label">拖动控制器，调整姿态</div><character-rig src="/riglab-project/rig.json" controls="visible" interaction="drag"></character-rig><button type="button">复位姿态 ↺</button>';
    import('/character-rig.js').then(()=>{if(!this.$el.isConnected)return;this.$el.querySelector('button').onclick=()=>this.$el.querySelector('character-rig').rig?.reset();});
  },
  beforeUnmount(){this.$el.replaceChildren();}
};
