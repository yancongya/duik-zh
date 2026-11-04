// Local opt-in inspection of the actual embedded instance, never a second rig.
// capture() reads the existing drawing buffer without requesting a new frame.
export function mountRigDiagnostics(host, getCharacter, signal) {
  if (signal.aborted || !host.isConnected) return;
  const url = new URL(location.href);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    || url.searchParams.get('rig-diagnostics') !== '1') return;
  const details = document.createElement('details');
  details.className = 'duik-rig-diagnostics';
  details.innerHTML = `<summary>本地画布诊断</summary>
    <p>读取当前角色的绘图缓冲，不重画、不改姿态。PNG 用于和屏幕上的 WebGL 画面对照。</p>
    <button type="button" data-rig-capture>读取当前画布</button>
    <button type="button" data-rig-context-loss>模拟画布失效</button>
    <pre data-rig-frame-result role="status">尚未读取</pre>
    <img data-rig-frame-preview alt="当前 WebGL 绘图缓冲的 PNG 快照，不是原图回退" hidden>`;
  host.append(details);
  const read = details.querySelector('[data-rig-capture]');
  const output = details.querySelector('[data-rig-frame-result]');
  const preview = details.querySelector('[data-rig-frame-preview]');
  let sample = 0;
  function invalidate(message) {
    sample++; read.disabled = false; preview.hidden = true;
    preview.removeAttribute('src'); output.textContent = message;
  }
  host.addEventListener('rig-error', () => invalidate('角色实例已失效，请重试后重新读取。'), {capture:true, signal});
  host.addEventListener('rig-ready', () => invalidate('当前角色已就绪，点击读取画布。'), {signal});
  read.addEventListener('click', async () => {
    const version = ++sample;
    read.disabled = true; preview.hidden = true;
    try {
      const character = getCharacter(), rig = character?.rig;
      if (!rig) throw new Error('当前没有可读取的交互角色，请先重新加载角色。');
      const snapshot = rig.capture(), state = rig.getState();
      const sourceCanvas = character.shadowRoot.querySelector('canvas');
      const contextLost = sourceCanvas.getContext('webgl').isContextLost();
      const image = new Image(); image.src = snapshot; await image.decode();
      if (signal.aborted || version !== sample) return;
      if (getCharacter() !== character || character.rig !== rig) {
        invalidate('角色实例已切换，请重新读取。'); return;
      }
      const probe = document.createElement('canvas');
      probe.width = image.naturalWidth; probe.height = image.naturalHeight;
      const context = probe.getContext('2d', {willReadFrequently:true});
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
      let alphaPixels = 0;
      for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) alphaPixels++;
      output.textContent = JSON.stringify({
        sourceSha256:state.sourceSha256, frames:state.frames, active:state.active,
        rafScheduled:state.rafScheduled, mode:state.mode, visibleParts:state.visibleParts.length,
        width:probe.width, height:probe.height, alphaPixels,
        contextLost, webglError:state.webglError,
        pose:state.pose,
      }, null, 2);
      preview.src = snapshot; preview.hidden = false;
    } catch (error) {
      if (!signal.aborted && version === sample) output.textContent = error.message;
    } finally {
      if (!signal.aborted && version === sample) read.disabled = false;
    }
  }, {signal});
  details.querySelector('[data-rig-context-loss]').addEventListener('click', () => {
    const character = getCharacter();
    if (!character?.rig) { output.textContent = '请先等待当前角色加载完成。'; return; }
    const canvas = character.shadowRoot.querySelector('canvas');
    const extension = canvas?.getContext('webgl')?.getExtension('WEBGL_lose_context');
    if (!extension) { output.textContent = '当前实例没有可用的 WebGL 上下文失效测试能力。'; return; }
    extension.loseContext();
    output.textContent = '已请求当前角色上下文失效；应出现静态原图与“重新加载角色”。';
  }, {signal});
  signal.addEventListener('abort', () => { sample++; details.remove(); }, {once:true});
}
