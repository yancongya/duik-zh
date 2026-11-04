// Vue owns this empty slot; the framework-neutral character owns its children.
// Keep the copied parent's scroll choreography and avoid post-hydration DOM replacement.
import {a as element} from './entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const slot = {
  name: 'DuikInteractiveSlot',
  mounted() {
    import('/duik-landing.js').then(module => {
      if (!this.$el.isConnected) return;
      this.disposeDuik = module.mountSlot(this.$el);
    }).catch(error => { this.$el.textContent = '角色加载失败，请刷新或阅读中文指南。'; console.error(error); });
  },
  beforeUnmount() { this.disposeDuik?.(); },
  render() { return element('div', {class: 'duik-input-slot'}); },
};
export {slot as _};
