export function createDrawer({ verticalShelf, reduced }) {
  const scene = document.querySelector('#portfolio-drawer');
  const tray = document.querySelector('#drawer-tray');
  const interior = document.querySelector('#drawer-interior');
  const handle = document.querySelector('#drawer-handle');
  const instruction = document.querySelector('#drawer-instruction');
  const announcement = document.querySelector('#announcement');
  let progress = 0;
  let travel = 1;
  let gesture = null;
  let ignoreClickUntil = 0;
  let settlementTimer;

  function position(event) {
    return verticalShelf.matches ? event.clientY : event.clientX;
  }

  function setProgress(value) {
    progress = Math.min(1, Math.max(0, value));
    scene.style.setProperty('--drawer-progress', progress);
  }

  function finish(open, announce = false) {
    scene.dataset.state = open ? 'open' : 'closed';
    interior.inert = !open;
    interior.setAttribute('aria-hidden', String(!open));
    handle.setAttribute('aria-expanded', String(open));
    handle.setAttribute('aria-label', `${open ? 'Закрыть' : 'Открыть'} ящик с проектами`);
    if (announce) announcement.textContent = open ? 'Ящик открыт. Выберите проект.' : 'Ящик закрыт.';
  }

  function settle(open, immediate = false, announce = true) {
    clearTimeout(settlementTimer);
    scene.classList.toggle('is-dragging', immediate || reduced.matches);
    interior.inert = true;
    interior.setAttribute('aria-hidden', 'true');
    scene.dataset.state = open ? 'opening' : 'closing';
    setProgress(open ? 1 : 0);
    if (immediate || reduced.matches) {
      finish(open, announce);
      requestAnimationFrame(() => scene.classList.remove('is-dragging'));
    } else {
      settlementTimer = setTimeout(() => finish(open, announce), 680);
    }
  }

  function measure() {
    if (!tray.offsetWidth || !tray.offsetHeight) return;
    const front = scene.querySelector('.drawer-front');
    travel = Math.max(1, verticalShelf.matches
      ? tray.offsetHeight - front.offsetHeight
      : tray.offsetWidth - front.offsetWidth);
    scene.style.setProperty('--drawer-travel', `${travel}px`);
    scene.style.setProperty('--mobile-drawer-height', `${tray.offsetHeight}px`);
  }

  function updateDirection() {
    if (gesture) {
      if (handle.hasPointerCapture(gesture.pointerId)) handle.releasePointerCapture(gesture.pointerId);
      gesture = null;
    }
    scene.classList.remove('is-dragging');
    instruction.textContent = `Потяните ручку ${verticalShelf.matches ? 'вниз' : 'вправо'} или нажмите её, чтобы открыть ящик с проектами.`;
    measure();
    settle(progress >= .5, true, false);
  }

  handle.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    clearTimeout(settlementTimer);
    // Resume a gesture from the visible position, including during a settling animation.
    const transform = new DOMMatrixReadOnly(getComputedStyle(tray).transform);
    const offset = verticalShelf.matches ? transform.m42 : transform.m41;
    measure();
    setProgress(1 + offset / travel);
    scene.classList.add('is-dragging');
    scene.dataset.state = 'dragging';
    interior.inert = true;
    gesture = { pointerId: event.pointerId, start: position(event), progress, moved: false };
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const distance = position(event) - gesture.start;
    if (Math.abs(distance) > 4) gesture.moved = true;
    if (!gesture.moved) return;
    event.preventDefault();
    setProgress(gesture.progress + distance / travel);
  });

  function endGesture(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const distance = position(event) - gesture.start;
    const moved = gesture.moved;
    const startProgress = gesture.progress;
    gesture = null;
    scene.classList.remove('is-dragging');
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    if (event.type === 'pointercancel') {
      ignoreClickUntil = performance.now() + 250;
      settle(startProgress >= .5);
      return;
    }
    if (moved) {
      ignoreClickUntil = performance.now() + 250;
      const farEnough = Math.abs(distance) > Math.min(90, travel * .18);
      settle(farEnough ? distance > 0 : progress >= .5);
    }
  }

  handle.addEventListener('pointerup', endGesture);
  handle.addEventListener('pointercancel', endGesture);
  handle.addEventListener('lostpointercapture', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture = null;
    scene.classList.remove('is-dragging');
    settle(progress >= .5);
  });
  handle.addEventListener('click', event => {
    if (performance.now() < ignoreClickUntil) {
      event.preventDefault();
      return;
    }
    settle(progress < .5);
  });
  handle.addEventListener('keydown', event => {
    const openKey = verticalShelf.matches ? 'ArrowDown' : 'ArrowRight';
    const closeKey = verticalShelf.matches ? 'ArrowUp' : 'ArrowLeft';
    if (![openKey, closeKey].includes(event.key)) return;
    event.preventDefault();
    settle(event.key === openKey);
  });

  const observer = new ResizeObserver(measure);
  observer.observe(interior);
  observer.observe(scene);
  verticalShelf.addEventListener('change', updateDirection);
  updateDirection();
  finish(false);
  scene.classList.add('is-ready');

  return { open: (immediate = false) => settle(true, immediate, false) };
}
