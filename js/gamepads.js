/**
 * Reusable reader for the browser Gamepad API.
 * It knows the W3C standard layout and nothing about a particular game.
 *
 *   const pads = new Gamepads();
 *   const frame = pads.poll(); // once per animation frame
 *   frame[0].direction          // one axis, for grid movement
 *   frame[0].buttons.south      // A / Cross, held this frame?
 *
 * The first entry is the first connected controller, regardless of its index.
 */

export const STANDARD_BUTTONS = Object.freeze({
  south: 0,
  east: 1,
  west: 2,
  north: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  select: 8,
  start: 9,
  l3: 10,
  r3: 11,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
});

const BUTTON_NAMES = Object.keys(STANDARD_BUTTONS);
const HOLD_THRESHOLD = 0.5;

export class Gamepads {
  constructor(options = {}) {
    this.deadzone = clamp(options.deadzone ?? 0.4, 0, 0.9);
    this._getGamepads = options.getGamepads || defaultGetGamepads;
    this._previous = new Map();
    this._listeners = { connect: new Set(), disconnect: new Set() };
    const target = options.target === undefined ? defaultTarget() : options.target;
    this._target = target;
    this._onConnect = (event) => {
      const pad = event?.gamepad;
      if (!pad) return;
      this._emit("connect", { index: pad.index, id: pad.id || "" });
    };
    this._onDisconnect = (event) => {
      const pad = event?.gamepad;
      if (!pad) return;
      this._previous.delete(pad.index);
      this._emit("disconnect", { index: pad.index, id: pad.id || "" });
    };
    target?.addEventListener("gamepadconnected", this._onConnect);
    target?.addEventListener("gamepaddisconnected", this._onDisconnect);
  }

  on(type, listener) {
    const set = this._listeners[type];
    if (!set) throw new Error(`Unknown gamepad event: ${type}`);
    set.add(listener);
    return () => set.delete(listener);
  }

  destroy() {
    this._target?.removeEventListener("gamepadconnected", this._onConnect);
    this._target?.removeEventListener("gamepaddisconnected", this._onDisconnect);
    this._previous.clear();
  }

  get connected() {
    return this._list().length;
  }

  /** Snapshot every connected pad. Call once per frame; edges last one call. */
  poll() {
    const hardware = this._list();
    const seen = new Set();
    const frame = hardware.map((gp, slot) => {
      seen.add(gp.index);
      return this._read(gp, slot);
    });
    for (const index of this._previous.keys()) {
      if (!seen.has(index)) this._previous.delete(index);
    }
    return frame;
  }

  _list() {
    let list = [];
    try {
      list = this._getGamepads() || [];
    } catch {
      list = [];
    }
    return [...list].filter(Boolean).sort((a, b) => a.index - b.index);
  }

  _read(gp, slot) {
    const prev = this._previous.get(gp.index) || {
      buttons: [],
      direction: { x: 0, y: 0 },
      bias: "x",
    };
    const buttons = {};
    const held = [];
    for (const name of BUTTON_NAMES) {
      const index = STANDARD_BUTTONS[name];
      const src = gp.buttons?.[index] || { pressed: false, value: 0 };
      const value = Number(src.value) || (src.pressed ? 1 : 0);
      const down = !!src.pressed || value >= HOLD_THRESHOLD;
      const was = !!prev.buttons[index];
      held[index] = down;
      buttons[name] = {
        index,
        held: down,
        pressed: down && !was,
        released: !down && was,
        value,
      };
    }

    const left = applyDeadzone(axis(gp, 0), axis(gp, 1), this.deadzone);
    const right = applyDeadzone(axis(gp, 2), axis(gp, 3), this.deadzone);
    const dpad = digitalPair(
      (buttons.right.held ? 1 : 0) - (buttons.left.held ? 1 : 0),
      (buttons.down.held ? 1 : 0) - (buttons.up.held ? 1 : 0),
    );
    const dpadActive = dpad.x !== 0 || dpad.y !== 0;
    const source = dpadActive ? dpad : left;
    const collapsed = singleAxis(source.x, source.y, prev.bias);
    const direction = {
      x: collapsed.x,
      y: collapsed.y,
      pressedX: collapsed.x !== 0 && collapsed.x !== prev.direction.x,
      pressedY: collapsed.y !== 0 && collapsed.y !== prev.direction.y,
    };

    this._previous.set(gp.index, { buttons: held, direction, bias: collapsed.bias });

    const active = direction.x !== 0 || direction.y !== 0 || held.some(Boolean);
    return {
      slot,
      index: gp.index,
      id: gp.id || "",
      mapping: gp.mapping || "",
      active,
      buttons,
      axes: { lx: left.x, ly: left.y, rx: right.x, ry: right.y },
      sticks: {
        left: stickState(left),
        right: stickState(right),
      },
      direction,
    };
  }

  _emit(type, detail) {
    for (const listener of this._listeners[type]) listener(detail);
  }
}

function defaultTarget() {
  return typeof window === "undefined" ? null : window;
}

function defaultGetGamepads() {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return [];
  return navigator.getGamepads();
}

function axis(gp, index) {
  const value = gp.axes?.[index];
  return Number.isFinite(value) ? value : 0;
}

export function applyDeadzone(x, y, deadzone) {
  const mag = Math.hypot(x, y);
  if (mag < deadzone || mag === 0) return { x: 0, y: 0 };
  const scaled = Math.min(1, (mag - deadzone) / (1 - deadzone));
  const gain = scaled / mag;
  return { x: x * gain, y: y * gain };
}

function digitalPair(x, y) {
  return {
    x: x < 0 ? -1 : x > 0 ? 1 : 0,
    y: y < 0 ? -1 : y > 0 ? 1 : 0,
  };
}

function stickState(vector) {
  const digital = digitalPair(vector.x, vector.y);
  return { x: vector.x, y: vector.y, digitalX: digital.x, digitalY: digital.y };
}

/** Keep a single axis so grid games do not walk diagonally. */
function singleAxis(x, y, prevBias) {
  const dx = x < 0 ? -1 : x > 0 ? 1 : 0;
  const dy = y < 0 ? -1 : y > 0 ? 1 : 0;
  if (!dx || !dy) return { x: dx, y: dy, bias: dx ? "x" : dy ? "y" : prevBias };
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  let bias = prevBias === "y" ? "y" : "x";
  if (ax > ay + 0.2) bias = "x";
  else if (ay > ax + 0.2) bias = "y";
  return bias === "x" ? { x: dx, y: 0, bias } : { x: 0, y: dy, bias };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
