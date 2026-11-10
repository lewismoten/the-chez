// Keep native button focus while sending held inputs through the engine keyboard.
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine';
type GameInput = Pick<Machine, 'keyboard'>;

export function bindGameButton(button: HTMLButtonElement, scan: number, getMachine: () => GameInput | undefined) {
  let held: GameInput | undefined;
  const press = () => {
    button.setAttribute('data-pressed', 'true');
    if (held) return;
    held = getMachine();
    held?.keyboard.inject(scan, true);
  };
  const release = () => {
    button.setAttribute('data-pressed', 'false');
    held?.keyboard.inject(scan, false);
    held = undefined;
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.focus({ preventScroll: true });
    button.setPointerCapture(event.pointerId);
    press();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'])
    button.addEventListener(type, release);
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) press();
  });
  button.addEventListener('keyup', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    release();
  });
  // Assistive technology can activate a button with a click alone.
  button.addEventListener('click', (event) => {
    if (event.detail === 0) { press(); release(); }
  });
  window.addEventListener('blur', release);
}
