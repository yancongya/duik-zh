import {a as element} from '/_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import {experienceView} from './experience-layout.mjs';

export function makeExperience(kind){
  return {
    name:'DuikExperience_'+kind,inheritAttrs:false,props:{blok:Object},
    mounted(){
      import('./experience-mount.mjs').then(({mountExperience})=>{
        if(this.$el.isConnected)this.disposeExperience=mountExperience(this.$el,kind);
      }).catch(error=>{
        const message=document.createElement('p');message.className='duik-demo-note';
        message.textContent='交互暂时不可用，仍可通过链接阅读工具文档。';
        if(this.$el.isConnected)this.$el.append(message);console.error(error);
      });
    },
    beforeUnmount(){this.disposeExperience?.();},
    render(){const view=experienceView(kind);return element(view.tag,{...view.attrs,innerHTML:view.html});},
  };
}
