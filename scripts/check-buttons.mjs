// Held inputs must target their original Machine and release on keyboard, pointer and focus loss.
import assert from 'node:assert/strict';
import { bindGameButton } from '../src/game-button.ts';
class Button extends EventTarget {
  attributes = new Map();
  setAttribute(key, value) { this.attributes.set(key, value); }
  focus() { this.focused = true; }
  setPointerCapture() {}
}
const send = (target, type, props = {}) => {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, props);
  target.dispatchEvent(event);
  return event;
};
globalThis.window = new EventTarget();
try {
  for (const scan of [75, 77, 72, 80, 57]) {
    const events = [], replacementEvents = [];
    const first = { keyboard: { inject: (...args) => events.push(args) } };
    let machine = first;
    const button = new Button();
    bindGameButton(button, scan, () => machine);
    for (const key of ['Enter', ' ']) {
      assert.ok(send(button, 'keydown', { key }).defaultPrevented);
      assert.equal(button.attributes.get('data-pressed'), 'true');
      send(button, 'keydown', { key, repeat: true });
      send(button, 'keyup', { key });
      assert.equal(button.attributes.get('data-pressed'), 'false');
      assert.deepEqual(events.splice(0), [[scan, true], [scan, false]]);
    }
    send(button, 'pointerdown', { pointerId: 1 });
    assert.equal(button.attributes.get('data-pressed'), 'true');
    assert.ok(button.focused);
    machine = { keyboard: { inject: (...args) => replacementEvents.push(args) } };
    send(button, 'pointerup');
    assert.equal(button.attributes.get('data-pressed'), 'false');
    assert.deepEqual(events.splice(0), [[scan, true], [scan, false]]);
    assert.deepEqual(replacementEvents, []);
    machine = first;
    for (const end of ['blur', 'pointercancel', 'lostpointercapture']) {
      send(button, 'pointerdown', { pointerId: 1 });
      send(button, end);
      assert.equal(button.attributes.get('data-pressed'), 'false');
      assert.deepEqual(events.splice(0), [[scan, true], [scan, false]]);
    }
    send(button, 'click', { detail: 0 });
    assert.deepEqual(events.splice(0), [[scan, true], [scan, false]]);
    send(button, 'keydown', { key: ' ' });
    send(window, 'blur');
    assert.equal(button.attributes.get('data-pressed'), 'false');
    assert.deepEqual(events.splice(0), [[scan, true], [scan, false]]);
  }
  console.log('All five game buttons: Enter/Space, repeats, pointer focus, Machine replacement, cancellation, blur and assistive clicks passed.');
} finally { delete globalThis.window; }
