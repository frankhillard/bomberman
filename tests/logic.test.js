import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLS,
  ROWS,
  TILE,
  beginAdventure,
  beginBattle,
  createGame,
  tileCenter,
  tileOf,
  update,
} from "../js/game.js";

function none() {
  return { keys: new Set(), pressed: new Set(), order: [] };
}

function hold(...codes) {
  return { keys: new Set(codes), pressed: new Set(), order: codes };
}

function press(...codes) {
  return { keys: new Set(codes), pressed: new Set(codes), order: codes };
}

function playable() {
  const game = createGame();
  beginAdventure(game, 1);
  game.state = "play";
  game.intro = 0;
  for (const e of game.enemies) e.speed = 0;
  return game;
}

function frames(game, n, input = none()) {
  for (let i = 0; i < n; i++) update(game, input, 1 / 60);
}

function bomb(c, r, extra = {}) {
  return {
    owner: 0,
    c,
    r,
    x: tileCenter(c),
    y: tileCenter(r),
    fire: 4,
    timer: 9,
    age: 1,
    remote: false,
    armed: true,
    spent: false,
    sliding: null,
    kicker: 0,
    kickGrace: 0,
    passers: new Set(),
    ...extra,
  };
}

test("adventure spawns leave a corridor and plant pillars", () => {
  const game = playable();
  assert.equal(game.map[1][1].solid, "empty");
  assert.equal(game.map[1][2].solid, "empty");
  assert.equal(game.map[2][1].solid, "empty");
  assert.equal(game.map[2][2].solid, "hard");
  assert.equal(game.map[0][0].solid, "hard");
  assert.ok(game.enemies.length >= 1);
  assert.equal(game.players[0].lives, 3);
});

test("battle corners are open", () => {
  const game = createGame();
  beginBattle(game, 1, false);
  for (const [c, r] of [[1, 1], [2, 1], [1, 2], [13, 11], [12, 11], [13, 10], [13, 1], [1, 11]]) {
    assert.equal(game.map[r][c].solid, "empty", `${c},${r}`);
  }
  assert.equal(game.players.length, 4);
  assert.equal(game.players.filter((p) => p.cpu).length, 3);
});

test("a blaster can walk off the bomb they just placed", () => {
  const game = playable();
  const p = game.players[0];
  const start = p.x;
  update(game, press("Space", "ArrowRight"), 1 / 60);
  assert.equal(game.bombs.length, 1);
  frames(game, 40, hold("ArrowRight"));
  assert.ok(p.x > start + 8, `x ${p.x}`);
  assert.ok(p.alive);
});

test("a settled bomb blocks the way back", () => {
  const game = playable();
  const p = game.players[0];
  update(game, press("Space", "ArrowRight"), 1 / 60);
  frames(game, 50, hold("ArrowRight"));
  assert.ok(tileOf(p.x) >= 2);
  frames(game, 60, hold("ArrowLeft"));
  assert.ok(p.x > tileCenter(1) + 6, `returned to ${p.x}`);
});

test("corner nudge slides into a corridor", () => {
  const game = playable();
  const p = game.players[0];
  p.x = tileCenter(1);
  p.y = tileCenter(1) + 4;
  frames(game, 40, hold("ArrowRight"));
  assert.ok(p.x > tileCenter(1) + 10, `x ${p.x}`);
  assert.ok(Math.abs(p.y - tileCenter(1)) < 2.5, `y ${p.y}`);
});

test("blast destroys a soft block and leaves the item inside", () => {
  const game = playable();
  const p = game.players[0];
  p.invuln = 10;
  p.fire = 3;
  for (let c = 1; c <= 4; c++) {
    game.map[1][c].solid = c === 3 ? "soft" : "empty";
    game.map[1][c].item = c === 3 ? "speed" : null;
    game.map[1][c].exit = false;
  }
  update(game, press("Space"), 1 / 60);
  frames(game, 200);
  assert.equal(game.map[1][3].solid, "empty");
  assert.equal(game.map[1][3].item, "speed");
});

test("flame stops at a hard block", () => {
  const game = playable();
  game.players[0].invuln = 10;
  game.players[0].fire = 6;
  for (let c = 1; c <= 5; c++) {
    game.map[1][c].solid = c === 3 ? "hard" : c === 4 ? "soft" : "empty";
    game.map[1][c].item = null;
    game.map[1][c].exit = false;
  }
  update(game, press("Space"), 1 / 60);
  frames(game, 200);
  assert.equal(game.map[1][3].solid, "hard");
  assert.equal(game.map[1][4].solid, "soft");
});

test("bombs chain", () => {
  const game = playable();
  game.players[0].invuln = 10;
  for (let c = 1; c <= 5; c++) {
    game.map[1][c].solid = "empty";
    game.map[1][c].item = null;
  }
  game.bombs.push(bomb(1, 1, { timer: 0.05, fire: 5 }));
  game.bombs.push(bomb(4, 1, { timer: 8, fire: 2 }));
  frames(game, 30);
  assert.equal(game.bombs.length, 0);
  assert.ok(game.explosions.length >= 1 || game.clock > 0);
});

test("standing on your bomb is fatal once the fuse ends", () => {
  const game = playable();
  const p = game.players[0];
  assert.equal(p.invuln, 0);
  update(game, press("Space"), 1 / 60);
  frames(game, 190);
  assert.ok(p.lives < 3);
  assert.ok(!p.alive || p.invuln > 0);
});

test("a vest keeps you alive in the blast", () => {
  const game = playable();
  const p = game.players[0];
  p.invuln = 8;
  update(game, press("Space"), 1 / 60);
  frames(game, 190);
  assert.equal(p.lives, 3);
  assert.equal(p.alive, true);
});

test("kick slides a bomb until it hits a wall", () => {
  const game = playable();
  const p = game.players[0];
  p.kick = true;
  p.x = tileCenter(3);
  p.y = tileCenter(1);
  for (let c = 1; c <= 6; c++) {
    game.map[1][c].solid = "empty";
    game.map[1][c].item = null;
    game.map[1][c].exit = false;
  }
  game.map[1][7].solid = "hard";
  game.bombs.push(bomb(4, 1));
  frames(game, 90, hold("ArrowRight"));
  const kicked = game.bombs[0];
  assert.ok(kicked, "bomb vanished");
  assert.equal(kicked.sliding, null);
  assert.equal(kicked.c, 6);
});

test("walking onto an item grants it", () => {
  const game = playable();
  const p = game.players[0];
  game.map[1][2].solid = "empty";
  game.map[1][2].item = "fire";
  game.map[1][2].exit = false;
  game.map[1][3].solid = "empty";
  game.map[1][3].item = null;
  frames(game, 50, hold("ArrowRight"));
  assert.equal(game.map[1][2].item, null);
  assert.equal(p.fire, 2);
});

test("the exit opens only after every foe is gone", () => {
  const game = playable();
  const p = game.players[0];
  p.x = tileCenter(1);
  p.y = tileCenter(1);
  game.map[1][2].solid = "empty";
  game.map[1][2].item = null;
  game.map[1][2].exit = true;
  game.exitRevealed = true;
  frames(game, 18, hold("ArrowRight"));
  assert.equal(game.state, "play");
  game.enemies = [];
  p.x = tileCenter(2);
  p.y = tileCenter(1);
  frames(game, 5);
  assert.equal(game.state, "stageclear");
  assert.ok(game.score > 0);
});

test("pause resumes, and resign returns to the title", () => {
  const game = playable();
  const time = game.time;
  update(game, press("KeyP"), 1 / 60);
  assert.equal(game.paused, true);
  assert.equal(game.menuIndex, 0);
  frames(game, 30);
  assert.equal(game.time, time);
  assert.equal(game.state, "play");

  update(game, press("Enter"), 1 / 60);
  assert.equal(game.paused, false);
  assert.equal(game.state, "play");

  update(game, press("Escape"), 1 / 60);
  update(game, press("ArrowDown"), 1 / 60);
  assert.equal(game.menuIndex, 1);
  assert.equal(game.state, "play");
  update(game, press("Escape"), 1 / 60);
  assert.equal(game.paused, false);
  assert.equal(game.state, "play");

  update(game, press("KeyP"), 1 / 60);
  frames(game, 30);
  update(game, press("ArrowDown"), 1 / 60);
  update(game, press("Enter"), 1 / 60);
  assert.equal(game.state, "title");
  assert.equal(game.paused, false);
  assert.equal(game.menuIndex, 0);
  assert.equal(game.players.length, 0);
  assert.equal(game.bombs.length, 0);
});

test("menu selection advances slowly while a direction is held", () => {
  const game = createGame();
  const input = hold("ArrowDown");
  update(game, input, 1 / 60);
  assert.equal(game.menuIndex, 1);
  frames(game, 12, input);
  assert.equal(game.menuIndex, 1);
  frames(game, 30, input);
  assert.equal(game.menuIndex, 0);
  update(game, press("ArrowDown"), 1 / 60);
  assert.equal(game.menuIndex, 0);
});

test("battle and adventure simulations stay in bounds", () => {
  const battle = createGame();
  beginBattle(battle, 1, false);
  battle.state = "play";
  for (let i = 0; i < 60 * 12; i++) {
    update(battle, none(), 1 / 60);
    if (battle.state !== "play") break;
  }
  for (const p of battle.players) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x > 8 && p.x < COLS * TILE - 8);
    assert.ok(p.y > 8 && p.y < ROWS * TILE - 8);
  }

  const adventure = playable();
  const seq = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
  for (let i = 0; i < 700; i++) {
    const code = seq[Math.floor(i / 25) % seq.length];
    const keys = new Set([code]);
    const pressed = new Set();
    if (i % 45 === 0) {
      keys.add("Space");
      pressed.add("Space");
    }
    update(adventure, { keys, pressed, order: [...keys] }, 1 / 60);
  }
  for (const p of adventure.players) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x > 0 && p.x < COLS * TILE);
    assert.ok(p.y > 0 && p.y < ROWS * TILE);
  }
});
