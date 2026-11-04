import {a as element,b as component} from '/_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import OriginalOrbit from '/_nuxt/duik-orbit-template.js';
import {orbitClass,orbitDetailsMarkup} from './orbit.mjs';

// Match the captured child's content count and 15-degree selection bias. The
// preference regression executes that child's real computed selection as oracle.
function selectedOrbitStep(blok,progress){
  const images=blok?.imgsTestimonial||[],items=blok?.listItemTestimonial||[];
  const count=images.filter((_,index)=>items[index]?.title||items[index]?.description).length;
  if(!count||progress===undefined||progress<=.5)return 0;
  const phase=progress<=1?(progress-.5)/.5*count:count;
  return Math.max(0,Math.min(count-1,Math.floor(phase+15/(360/images.length)+.5)));
}

export default {
  name:'DuikTemplateOrbit',inheritAttrs:false,
  props:{blok:Object,isMerged:{type:Boolean,default:false},mergedProgress:{default:0}},
  emits:['go-to-step'],
  data(){return {reduced:false,manualStep:0};},
  mounted(){
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>{
      if(preference.matches&&!this.reduced&&this.isMerged)this.manualStep=selectedOrbitStep(this.blok,this.mergedProgress);
      this.reduced=preference.matches;
    };changed();
    preference.addEventListener('change',changed);
    this.removePreference=()=>preference.removeEventListener('change',changed);
    import('./reuse-demo.mjs').then(({mountReuse})=>{
      if(this.$el.isConnected)this.disposeReuse=mountReuse(this.$el);
    }).catch(error=>console.error('Duik reuse workbench failed to mount',error));
  },
  beforeUnmount(){this.removePreference?.();this.disposeReuse?.();},
  render(){
    // The parent's R.value is the original 0 -> .5 -> 1 -> 1.5 contract:
    // orbit arrival -> selected items -> outgoing quarter turn.
    const progress=this.reduced?.5+this.manualStep*.1:this.mergedProgress;
    return element('section',{id:'reuse',class:this.isMerged?orbitClass:'duik-orbit-section w-full'},[
      component(OriginalOrbit,{blok:this.blok,isMerged:this.isMerged,mergedProgress:progress,onGoToStep:step=>{
        if(this.reduced)this.manualStep=step;else this.$emit('go-to-step',step);
      }}),
      element('details',{class:'duik-orbit-details',innerHTML:orbitDetailsMarkup}),
    ]);
  },
};
