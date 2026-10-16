export const TILE = 16;
export const COLS = 15;
export const ROWS = 13;
export const HUD_H = 24;
export const VIEW_W = COLS * TILE;
export const VIEW_H = HUD_H + ROWS * TILE;
export const HALF = 5.5;
export const NUDGE = 8;

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const DIR_LIST = ["up", "down", "left", "right"];
export const REVERSE = { up: "down", down: "up", left: "right", right: "left" };

export const NAMES = ["WHITE", "BLACK", "RED", "BLUE"];

export const SPAWNS = [
  { c: 1, r: 1 },
  { c: 13, r: 11 },
  { c: 13, r: 1 },
  { c: 1, r: 11 },
];

export const SPAWN_CLEARS = [
  [[1, 1], [2, 1], [1, 2]],
  [[13, 11], [12, 11], [13, 10]],
  [[13, 1], [12, 1], [13, 2]],
  [[1, 11], [2, 11], [1, 10]],
];

export function tileOf(pos) {
  return Math.floor(pos / TILE);
}

export function tileCenter(i) {
  return i * TILE + TILE / 2;
}

export function centerDelta(pos) {
  return tileCenter(tileOf(pos)) - pos;
}

export function isPillar(c, r) {
  if (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) return true;
  return c % 2 === 0 && r % 2 === 0;
}
