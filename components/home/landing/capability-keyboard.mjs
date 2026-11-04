// Keyboard entry joins the captured parent's existing scroll timeline. It never
// removes a scene from Tab order, moves focus, or starts a second animation.
const mounts = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (...values) => values.every(Number.isFinite);

export function mountCapabilityKeyboardFocus({root, getTrigger, gsap, isReduced = () => false, sync, revealOrbit} = {}) {
  const doc = root?.ownerDocument, win = doc?.defaultView;
  if (!win || typeof getTrigger !== 'function' || typeof gsap?.getProperty !== 'function') {
    throw new TypeError('Capability keyboard focus requires a DOM root and its timeline owner');
  }
  mounts.get(root)?.dispose();
  let disposed = false, suspended = false, tabArmed = false, pending = null;
  const listeners = [];
  const listen = (target, type, callback) => {
    target.addEventListener(type, callback, true);
    listeners.push(() => target.removeEventListener(type, callback, true));
  };
  const connected = target => !disposed && !doc.hidden && !isReduced()
    && root.isConnected !== false && target?.isConnected !== false
    && doc.activeElement === target && root.contains(target);
  const clear = () => {tabArmed = false;pending = null;};

  function align(target) {
    if (!connected(target)) return;
    const card = target.closest?.('.duik-capability-card');
    const orbit = target.closest?.('#reuse');
    const container = root.querySelector('.kp-container');
    if (!(orbit || card) || !root.contains(orbit || card) || !container) return;
    const bounds = container.getBoundingClientRect(), box = target.getBoundingClientRect();
    const style = win.getComputedStyle(container);
    const viewportWidth = doc.documentElement?.clientWidth || win.innerWidth;
    const viewportHeight = doc.documentElement?.clientHeight || win.innerHeight;
    const left = Math.max(0, bounds.left + (parseFloat(style.paddingLeft) || 0));
    const right = Math.min(viewportWidth, bounds.right - (parseFloat(style.paddingRight) || 0));
    const width = right - left;
    if (!finite(left, right, box.left, box.right, box.top, box.bottom) || width <= 0 || box.width <= 0 || box.height <= 0) return;
    // A visible control stays exactly where the user found it. This also avoids
    // recentering on every Tab between controls within an already visible scene.
    if (box.left >= left && box.right <= right && box.top >= 0 && box.bottom <= viewportHeight) return;

    // Respect an existing dialog's scroll lock in both parent-owned phases.
    if (win.lenis?.isStopped || win.lenis?.isLocked) return;
    if (orbit) {
      // Its arrival/selection phases are not the Motion translation phase. The
      // parent preserves the selected item and owns physical scroll plus update.
      if (typeof revealOrbit === 'function') revealOrbit(target);
      return;
    }

    const content = root.querySelector('.kp-home-capabilities-content');
    const trigger = getTrigger(), animation = trigger?.animation;
    if (!content || !animation?.getChildren) return;
    // Read the actual translation tween instead of duplicating the capture's
    // width, spacer or phase formulas. Re-resolve it after every parent rebuild.
    const translations = animation.getChildren(false, true, false).filter(tween =>
      tween.targets().includes(content) && Object.hasOwn(tween.vars, 'x'));
    if (translations.length !== 1) return;
    const travel = translations[0], distance = -Number(travel.vars.x);
    const x = Number(gsap.getProperty(content, 'x'));
    const duration = animation.totalDuration(), start = travel.startTime(), length = travel.duration();
    if (!finite(distance, x, duration, start, length, trigger.start, trigger.end)
      || distance <= 0 || duration <= 0 || length <= 0 || trigger.end <= trigger.start
      || !['none', 'linear'].includes(travel.vars.ease)) return;

    const cardBox = card.getBoundingClientRect();
    const stageBox = card.querySelector('[data-motion-stage]')?.getBoundingClientRect();
    const preferred = cardBox.width <= width ? cardBox
      : stageBox?.width > 0 && stageBox.height > 0 ? stageBox : box;
    let shift = (left + right - preferred.left - preferred.right) / 2;
    // A wide card is not an unreachable scene. Keep the focused control in view
    // first, and give its canvas as much space as the current viewport permits.
    shift = box.width <= width
      ? clamp(shift, left - box.left, right - box.right)
      : (left + right - box.left - box.right) / 2;
    const desiredX = clamp(x + shift, -distance, 0);
    const time = start + (-desiredX / distance) * length;
    const progress = clamp(time / duration, 0, 1);
    const top = trigger.start + progress * (trigger.end - trigger.start);
    if (!Number.isFinite(top)) return;

    // Never change the timeline without first updating physical scroll.
    if (typeof win.lenis?.scrollTo === 'function') win.lenis.scrollTo(top, {immediate: true});
    else win.scrollTo({top, behavior: 'instant'});
    if (sync) sync();
    else trigger.update?.();
  }

  listen(doc, 'keydown', event => {
    // A focusin alone may come from a pointer drag or internal focus restoration.
    // Consume neither Tab nor its default focus navigation; only observe intent.
    tabArmed = event.isTrusted === true && !event.defaultPrevented && event.key === 'Tab'
      && !event.altKey && !event.ctrlKey && !event.metaKey;
  });
  listen(doc, 'keyup', event => {if (event.key === 'Tab') tabArmed = false;});
  listen(doc, 'focusin', event => {
    const fromTab = tabArmed;clear();
    if (!fromTab || !connected(event.target)) return;
    if (suspended) pending = event.target;
    else align(event.target);
  });
  listen(doc, 'pointerdown', clear);
  listen(doc, 'visibilitychange', () => {if (doc.hidden) clear();});
  // Capture also receives the old element's blur during normal Tab navigation.
  // Only leaving the window cancels intent; element blur precedes focusin.
  listen(win, 'blur', event => {if (event.target === win) clear();});

  const controller = {
    suspend() {
      if (disposed) return;
      suspended = true;
      if (isReduced()) clear();
    },
    resume() {
      if (disposed) return;
      suspended = false;
      const target = pending;pending = null;
      if (target && connected(target)) align(target);
    },
    dispose() {
      if (disposed) return;
      disposed = true;clear();
      for (const remove of listeners) remove();
      if (mounts.get(root) === controller) mounts.delete(root);
    },
  };
  mounts.set(root, controller);
  return controller;
}
