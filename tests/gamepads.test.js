import { test } from "node:test";
import assert from "node:assert/strict";
import { Gamepads, applyDeadzone } from "../js/gamepads.js";

function button(pressed = false, value = pressed ? 1 : 0) {
  return { pressed, value };
}

function pad(overrides = {}) {
  const buttons = Array.from({ length: 16 }, () => button());
  return {
    index: 0,
    id: "Test Pad",
    mapping: "standard",
    buttons,
    axes: [0, 0, 0, 0],
    ...overrides,
  };
}

function reader(list) {
  return new Gamepads({
    target: null,
    getGamepads: () => list,
  });
}

test("small stick deflection stays inside the deadzone", () => {
  const pads = reader([pad({ axes: [0.2, -0.1, 0, 0] })]);
  const frame = pads.poll();
  assert.equal(frame[0].axes.lx, 0);
  assert.equal(frame[0].axes.ly, 0);
  assert.deepEqual({ x: frame[0].direction.x, y: frame[0].direction.y }, { x: 0, y: 0 });
});

test("a face button reports a press on the frame it goes down", () => {
  const hardware = pad();
  const pads = reader([hardware]);
  hardware.buttons[0] = button(true);
  const first = pads.poll()[0].buttons.south;
  assert.equal(first.held, true);
  assert.equal(first.pressed, true);
  assert.equal(first.released, false);

  const second = pads.poll()[0].buttons.south;
  assert.equal(second.held, true);
  assert.equal(second.pressed, false);

  hardware.buttons[0] = button(false);
  const third = pads.poll()[0].buttons.south;
  assert.equal(third.held, false);
  assert.equal(third.released, true);
});

test("the d-pad wins over the stick and diagonals keep one axis", () => {
  const hardware = pad({ axes: [1, 0, 0, 0] });
  hardware.buttons[14] = button(true);
  hardware.buttons[12] = button(true);
  const pads = reader([hardware]);
  const direction = pads.poll()[0].direction;
  assert.equal(direction.x, -1);
  assert.equal(direction.y, 0);
  assert.equal(direction.pressedX, true);
  assert.equal(direction.pressedY, false);
});

test("a stronger stick axis replaces the previous one", () => {
  const hardware = pad({ axes: [0.9, 0.2, 0, 0] });
  const pads = reader([hardware]);
  assert.equal(pads.poll()[0].direction.x, 1);

  hardware.axes = [0.3, 0.95, 0, 0];
  const next = pads.poll()[0].direction;
  assert.equal(next.x, 0);
  assert.equal(next.y, 1);
  assert.equal(next.pressedY, true);
});

test("connected pads are numbered from the first live controller", () => {
  const second = pad({ index: 2, id: "Only" });
  const pads = reader([null, undefined, second]);
  const frame = pads.poll();
  assert.equal(frame.length, 1);
  assert.equal(frame[0].slot, 0);
  assert.equal(frame[0].index, 2);
  assert.equal(pads.connected, 1);
});

test("unplugging a pad clears its edges", () => {
  const hardware = pad();
  let list = [hardware];
  const pads = new Gamepads({ target: null, getGamepads: () => list });
  hardware.buttons[1] = button(true);
  assert.equal(pads.poll()[0].buttons.east.pressed, true);
  list = [];
  assert.deepEqual(pads.poll(), []);
  list = [hardware];
  assert.equal(pads.poll()[0].buttons.east.pressed, true);
});

test("an analog trigger counts as held past the threshold", () => {
  const hardware = pad();
  hardware.buttons[6] = button(false, 0.8);
  const pads = reader([hardware]);
  const trigger = pads.poll()[0].buttons.l2;
  assert.equal(trigger.held, true);
  assert.equal(trigger.pressed, true);
  assert.equal(trigger.value, 0.8);
});

test("deadzone scaling keeps the stick direction", () => {
  const out = applyDeadzone(0.7, 0, 0.4);
  assert.ok(out.x > 0.4 && out.x <= 1);
  assert.equal(out.y, 0);
});

test("connect and disconnect listeners fire from the target", () => {
  const listeners = { gamepadconnected: [], gamepaddisconnected: [] };
  const target = {
    addEventListener(type, fn) { listeners[type].push(fn); },
    removeEventListener(type, fn) {
      listeners[type] = listeners[type].filter((item) => item !== fn);
    },
  };
  const seen = [];
  const pads = new Gamepads({ target, getGamepads: () => [] });
  pads.on("connect", (detail) => seen.push(["connect", detail.index]));
  pads.on("disconnect", (detail) => seen.push(["disconnect", detail.id]));
  listeners.gamepadconnected[0]({ gamepad: { index: 1, id: "Pad" } });
  listeners.gamepaddisconnected[0]({ gamepad: { index: 1, id: "Pad" } });
  pads.destroy();
  assert.deepEqual(seen, [["connect", 1], ["disconnect", "Pad"]]);
  assert.equal(listeners.gamepadconnected.length, 0);
});
