import {
  TILE,
  COLS,
  ROWS,
  HALF,
  NUDGE,
  DIRS,
  DIR_LIST,
  REVERSE,
  SPAWNS,
  SPAWN_CLEARS,
  tileOf,
  tileCenter,
  centerDelta,
  isPillar,
} from "./const.js";

export { TILE, COLS, ROWS, tileOf, tileCenter };

const FUSE = 2.6;
const CHAIN = 0.05;
const P1 = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  bomb: "Space",
  deton: "KeyB",
};
const P2 = {
  left: "KeyA",
  right: "KeyD",
  up: "KeyW",
  down: "KeyS",
  bomb: "KeyF",
  deton: "KeyG",
};

const ENEMY = {
  puff: { hp: 1, speed: 30, ai: "wander", turn: 0.28, points: 100 },
  skitter: { hp: 1, speed: 46, ai: "chase", turn: 0.2, points: 200 },
  dart: { hp: 1, speed: 70, ai: "chase", turn: 0.5, points: 400 },
  phantom: { hp: 1, speed: 42, ai: "chase", turn: 0.26, points: 800, phase: true },
  brute: { hp: 3, speed: 34, ai: "chase", turn: 0.16, points: 2000 },
};

const ITEM_WEIGHTS = [
  ["fire", 24],
  ["bomb", 24],
  ["speed", 16],
  ["kick", 10],
  ["remote", 8],
  ["bombpass", 7],
  ["wallpass", 7],
  ["vest", 4],
];

const ITEM_LABEL = {
  fire: "FIRE",
  bomb: "BOMB",
  speed: "SPEED",
  kick: "KICK",
  remote: "REMOTE",
  bombpass: "B-PASS",
  wallpass: "W-PASS",
  vest: "VEST",
};

export const STAGES = [
  { world: 1, stage: 1, name: "GREEN GARDEN", theme: "grass", time: 200, soft: 0.55, enemies: [["puff", 4]] },
  { world: 1, stage: 2, name: "GREEN GARDEN", theme: "grass", time: 200, soft: 0.62, enemies: [["puff", 3], ["skitter", 2]] },
  { world: 1, stage: 3, name: "HEDGE LANE", theme: "grass", time: 180, soft: 0.68, enemies: [["puff", 2], ["skitter", 3]] },
  { world: 2, stage: 1, name: "AMBER QUARRY", theme: "sand", time: 200, soft: 0.6, enemies: [["skitter", 3], ["dart", 1]] },
  { world: 2, stage: 2, name: "AMBER QUARRY", theme: "sand", time: 180, soft: 0.68, enemies: [["skitter", 2], ["dart", 3]] },
  { world: 2, stage: 3, name: "DUST GATE", theme: "sand", time: 180, soft: 0.7, enemies: [["dart", 3], ["phantom", 1]] },
  { world: 3, stage: 1, name: "FROST WORKS", theme: "ice", time: 180, soft: 0.62, enemies: [["phantom", 2], ["skitter", 2]] },
  { world: 3, stage: 2, name: "FROST WORKS", theme: "ice", time: 160, soft: 0.7, enemies: [["phantom", 2], ["dart", 2], ["skitter", 1]] },
  { world: 3, stage: 3, name: "ICE VAULT", theme: "ice", time: 160, soft: 0.72, enemies: [["phantom", 3], ["dart", 2]] },
  { world: 4, stage: 1, name: "NIGHT CASTLE", theme: "castle", time: 180, soft: 0.64, enemies: [["skitter", 2], ["brute", 1], ["dart", 1]] },
  { world: 4, stage: 2, name: "NIGHT CASTLE", theme: "castle", time: 160, soft: 0.7, enemies: [["brute", 1], ["phantom", 2], ["dart", 2]] },
  { world: 4, stage: 3, name: "THRONE ASH", theme: "castle", time: 150, soft: 0.74, enemies: [["brute", 2], ["dart", 2], ["phantom", 2]] },
];

function readBest() {
  try {
    return Number(localStorage.getItem("blasterman-best") || 0) || 0;
  } catch {
    return 0;
  }
}

function writeBest(n) {
  try {
    localStorage.setItem("blasterman-best", String(n));
  } catch {
    /* private mode */
  }
}

function sfx(game, name) {
  if (!game.audio || game.muted) return;
  game.audio.play(name);
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function rollItem() {
  let total = 0;
  for (const [, w] of ITEM_WEIGHTS) total += w;
  let r = Math.random() * total;
  for (const [name, w] of ITEM_WEIGHTS) {
    r -= w;
    if (r <= 0) return name;
  }
  return "fire";
}

function playerSpeed(p) {
  return 54 + p.speedLevel * 13;
}

export function createGame() {
  return {
    state: "title",
    clock: 0,
    menuIndex: 0,
    mode: "normal",
    humans: 1,
    stageIndex: 0,
    score: 0,
    best: readBest(),
    time: 0,
    intro: 0,
    extraBanner: "",
    clearTimer: 0,
    clearBonus: 0,
    lifeBonus: 0,
    players: [],
    roster: [],
    enemies: [],
    bombs: [],
    explosions: [],
    particles: [],
    floaters: [],
    map: [],
    stage: null,
    exitRevealed: false,
    exitUnlocked: false,
    exitAnnounced: false,
    paused: false,
    winner: null,
    shake: 0,
    audio: null,
    muted: false,
    announce: null,
    nextId: 1,
    sudden: false,
    timeUpHandled: false,
    reduceMotion: false,
  };
}

function blankInput(input) {
  return {
    keys: input?.keys || new Set(),
    pressed: input?.pressed || new Set(),
    order: input?.order || [],
  };
}

function hit(input, ...codes) {
  return codes.some((c) => input.pressed.has(c));
}

function menuDelta(input) {
  if (hit(input, "ArrowUp", "KeyW")) return -1;
  if (hit(input, "ArrowDown", "KeyS")) return 1;
  return 0;
}

function confirmed(input) {
  return hit(input, "Enter", "Space");
}

function backed(input) {
  return hit(input, "Escape", "Backspace");
}

export function beginAdventure(game, humans) {
  game.mode = "normal";
  game.humans = humans;
  game.score = 0;
  game.stageIndex = 0;
  game.lifeBonus = 0;
  game.paused = false;
  game.winner = null;
  game.roster = [];
  for (let i = 0; i < humans; i++) {
    game.roster.push({ slot: i, cpu: false, lives: 3, out: false, kills: 0 });
  }
  buildLevel(game, STAGES[0]);
  enterIntro(game, "");
  sfx(game, "start");
}

export function beginBattle(game, humans, duel = false) {
  game.mode = "battle";
  game.humans = humans;
  game.score = 0;
  game.stageIndex = 0;
  game.paused = false;
  game.winner = null;
  const total = duel ? 2 : 4;
  game.roster = [];
  for (let i = 0; i < total; i++) {
    game.roster.push({ slot: i, cpu: i >= humans, lives: 1, out: false, kills: 0 });
  }
  const themes = ["grass", "sand", "ice", "castle"];
  buildLevel(game, {
    world: 0,
    stage: 0,
    name: "BATTLE ARENA",
    theme: themes[Math.floor(Math.random() * themes.length)],
    time: 120,
    soft: 0.62,
    enemies: [],
    exit: false,
  });
  enterIntro(game, "");
  sfx(game, "start");
}

function enterIntro(game, extra) {
  game.state = "intro";
  game.intro = 1.75;
  game.extraBanner = extra || "";
  game.paused = false;
  sfx(game, "stage");
}

function buildLevel(game, spec) {
  game.stage = spec;
  game.time = spec.time;
  game.bombs = [];
  game.explosions = [];
  game.particles = [];
  game.floaters = [];
  game.enemies = [];
  game.exitRevealed = false;
  game.exitUnlocked = false;
  game.exitAnnounced = false;
  game.sudden = false;
  game.timeUpHandled = false;
  game.shake = 0;
  game.announce = null;
  game.clearBonus = 0;
  generateMap(game, spec);
  game.players = game.roster.map((r) => makePlayer(r));
  spawnEnemies(game, spec);
}

function makePlayer(r) {
  const s = SPAWNS[r.slot];
  const x = tileCenter(s.c);
  const y = tileCenter(s.r);
  return {
    slot: r.slot,
    cpu: r.cpu,
    lives: r.lives,
    out: r.out,
    kills: r.kills,
    x,
    y,
    dir: r.slot % 2 === 0 ? "right" : "left",
    alive: !r.out,
    dying: 0,
    bombsMax: 1,
    fire: 1,
    speedLevel: 0,
    kick: false,
    remote: false,
    bombPass: false,
    wallPass: false,
    invuln: 0,
    walk: 0,
    moving: false,
    bombCd: 0,
    ai: { dir: null, stuck: 0, lx: x, ly: y },
  };
}

function syncRoster(game, p) {
  const r = game.roster.find((row) => row.slot === p.slot);
  if (!r) return;
  r.lives = p.lives;
  r.out = p.out;
  r.kills = p.kills;
}

function mirrorsOf(c, r) {
  const seen = new Set();
  const out = [];
  for (const [x, y] of [
    [c, r],
    [COLS - 1 - c, r],
    [c, ROWS - 1 - r],
    [COLS - 1 - c, ROWS - 1 - r],
  ]) {
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
    seen.add(key);
    out.push([x, y]);
  }
  return out;
}

function clearSet(game) {
  const slots = game.mode === "battle" ? [0, 1, 2, 3] : game.roster.map((r) => r.slot);
  const safe = new Set();
  for (const slot of slots) {
    for (const [c, r] of SPAWN_CLEARS[slot]) safe.add(`${c},${r}`);
  }
  return safe;
}

function generateMap(game, spec) {
  const map = [];
  for (let r = 0; r < ROWS; r++) {
    map[r] = [];
    for (let c = 0; c < COLS; c++) {
      map[r][c] = { solid: isPillar(c, r) ? "hard" : "empty", item: null, exit: false };
    }
  }
  game.map = map;
  const safe = clearSet(game);

  if (game.mode === "battle") {
    const seen = new Set();
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (map[r][c].solid !== "empty") continue;
        const group = mirrorsOf(c, r);
        const key = group.map(([x, y]) => `${x},${y}`).sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        if (group.some(([x, y]) => map[y][x].solid !== "empty")) continue;
        if (group.some(([x, y]) => safe.has(`${x},${y}`))) continue;
        if (Math.random() < spec.soft) {
          for (const [x, y] of group) map[y][x].solid = "soft";
        }
      }
    }
  } else {
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (map[r][c].solid !== "empty") continue;
        if (safe.has(`${c},${r}`)) continue;
        if (Math.random() < spec.soft) map[r][c].solid = "soft";
      }
    }
  }

  if (spec.exit !== false && game.mode === "normal") {
    const far = [];
    const any = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c].solid !== "soft") continue;
        any.push([c, r]);
        if (Math.abs(c - 1) + Math.abs(r - 1) >= 6) far.push([c, r]);
      }
    }
    const pool = far.length ? far : any;
    if (pool.length) {
      const [c, r] = pool[Math.floor(Math.random() * pool.length)];
      map[r][c].exit = true;
    }
  }

  assignItems(game, spec);
}

function guaranteedList(game, spec) {
  if (game.mode === "battle") {
    return ["fire", "bomb", "speed", "kick", "fire", "bomb", "remote", "speed"];
  }
  const list = ["fire", "bomb", "speed", "kick", "fire", "bomb", "speed"];
  if (spec.world >= 2) list.push("remote");
  if (spec.world >= 3) list.push("bombpass", "wallpass");
  if (spec.world >= 4) list.push("vest");
  return list;
}

function assignItems(game, spec) {
  const guaranteed = guaranteedList(game, spec);
  if (game.mode === "battle") {
    const seen = new Set();
    const groups = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (game.map[r][c].solid !== "soft") continue;
        const group = mirrorsOf(c, r).filter(([x, y]) => game.map[y][x].solid === "soft");
        const key = group.map(([x, y]) => `${x},${y}`).sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        groups.push(group);
      }
    }
    shuffle(groups);
    groups.forEach((group, i) => {
      let item = null;
      if (i < guaranteed.length) item = guaranteed[i];
      else if (Math.random() < 0.2) item = rollItem();
      if (!item) return;
      for (const [x, y] of group) game.map[y][x].item = item;
    });
    return;
  }

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (game.map[r][c].solid === "soft" && !game.map[r][c].exit) cells.push(game.map[r][c]);
    }
  }
  shuffle(cells);
  cells.forEach((cell, i) => {
    if (i < guaranteed.length) cell.item = guaranteed[i];
    else if (Math.random() < 0.16) cell.item = rollItem();
  });
}

function spawnEnemies(game, spec) {
  if (!spec.enemies) return;
  const safe = clearSet(game);
  const spots = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (game.map[r][c].solid !== "empty") continue;
      if (safe.has(`${c},${r}`)) continue;
      if (game.map[r][c].exit) continue;
      let near = false;
      for (const p of game.players) {
        if (Math.abs(tileOf(p.x) - c) + Math.abs(tileOf(p.y) - r) < 5) near = true;
      }
      if (!near) spots.push([c, r]);
    }
  }
  shuffle(spots);
  for (const [type, count] of spec.enemies) {
    for (let i = 0; i < count; i++) {
      const spot = spots.pop();
      if (!spot) return;
      game.enemies.push(makeEnemy(type, spot[0], spot[1]));
    }
  }
}

function makeEnemy(type, c, r) {
  const k = ENEMY[type];
  return {
    type,
    hp: k.hp,
    speed: k.speed,
    ai: k.ai,
    turn: k.turn,
    phase: !!k.phase,
    points: k.points,
    x: tileCenter(c),
    y: tileCenter(r),
    dir: DIR_LIST[Math.floor(Math.random() * 4)],
    dying: 0,
    dead: false,
    flash: 0,
    walk: Math.random() * 10,
    hitExplosions: new Set(),
  };
}

function addScore(game, n) {
  if (game.mode !== "normal" || n <= 0) return;
  game.score += n;
  if (game.score > game.best) {
    game.best = game.score;
    writeBest(game.best);
  }
}

function floater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, life: 0.85, vy: -20 });
}

function burst(game, x, y, colors, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random());
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.25,
      color: colors[i % colors.length],
      size: 1 + (i % 2),
    });
  }
  if (game.particles.length > 140) game.particles.splice(0, game.particles.length - 140);
}

function announce(game, text, t = 1.25) {
  game.announce = { text, t };
}

export function update(game, rawInput, dt) {
  const input = blankInput(rawInput);
  dt = Math.max(0, Math.min(0.05, dt));
  game.clock += dt;
  if (game.audio) game.audio.muted = game.muted;
  if (hit(input, "KeyM")) game.muted = !game.muted;

  if (game.state === "title") return updateTitle(game, input);
  if (game.state === "help") return updateHelp(game, input);
  if (game.state === "mode") return updateMode(game, input);
  if (game.state === "players") return updatePlayers(game, input);
  if (game.state === "battlemenu") return updateBattleMenu(game, input);
  if (game.state === "stageclear") return updateClear(game, input, dt);
  if (game.state === "gameover" || game.state === "victory" || game.state === "battleend") {
    return updateEnd(game, input);
  }

  if (game.state === "play" || game.state === "intro") {
    if (!game.paused && hit(input, "Escape", "KeyP")) {
      game.paused = true;
      game.menuIndex = 0;
      sfx(game, "pause");
      return;
    }
    if (game.paused) {
      updatePause(game, input);
      return;
    }
  }

  if (game.state === "intro") {
    game.intro -= dt;
    if (game.intro <= 0) {
      game.state = "play";
      announce(game, "GO", 0.65);
      const mercy = game.mode === "battle" ? 1.5 : 2.2;
      for (const p of game.players) if (p.alive && !p.out) p.invuln = mercy;
    }
    return;
  }

  if (game.state === "play") updatePlay(game, input, dt);
}

function updateTitle(game, input) {
  const d = menuDelta(input);
  if (d) game.menuIndex = (game.menuIndex + d + 2) % 2;
  if (!confirmed(input)) return;
  if (game.menuIndex === 1) {
    game.state = "help";
    return;
  }
  game.state = "mode";
  game.menuIndex = 0;
}

function updateHelp(game, input) {
  if (confirmed(input) || backed(input)) {
    game.state = "title";
    game.menuIndex = 0;
  }
}

function updateMode(game, input) {
  const d = menuDelta(input);
  if (d) game.menuIndex = (game.menuIndex + d + 2) % 2;
  if (backed(input)) {
    game.state = "title";
    game.menuIndex = 0;
    return;
  }
  if (!confirmed(input)) return;
  if (game.menuIndex === 0) {
    game.state = "players";
    game.menuIndex = 0;
  } else {
    game.state = "battlemenu";
    game.menuIndex = 0;
  }
}

function updatePlayers(game, input) {
  const d = menuDelta(input);
  if (d) game.menuIndex = (game.menuIndex + d + 2) % 2;
  if (backed(input)) {
    game.state = "mode";
    game.menuIndex = 0;
    return;
  }
  if (confirmed(input)) beginAdventure(game, game.menuIndex === 0 ? 1 : 2);
}

function updateBattleMenu(game, input) {
  const d = menuDelta(input);
  if (d) game.menuIndex = (game.menuIndex + d + 3) % 3;
  if (backed(input)) {
    game.state = "mode";
    game.menuIndex = 0;
    return;
  }
  if (!confirmed(input)) return;
  if (game.menuIndex === 0) beginBattle(game, 1, false);
  else if (game.menuIndex === 1) beginBattle(game, 2, false);
  else beginBattle(game, 2, true);
}

function updatePause(game, input) {
  const d = menuDelta(input);
  if (d) game.menuIndex = (game.menuIndex + d + 2) % 2;
  if (backed(input)) {
    resumeMatch(game);
    return;
  }
  if (!confirmed(input) && !hit(input, "KeyP")) return;
  if (game.menuIndex === 0) resumeMatch(game);
  else abandonMatch(game);
}

function resumeMatch(game) {
  game.paused = false;
  sfx(game, "pause");
}

function abandonMatch(game) {
  game.state = "title";
  game.menuIndex = 0;
  game.paused = false;
  game.players = [];
  game.enemies = [];
  game.bombs = [];
  game.explosions = [];
  game.particles = [];
  game.floaters = [];
  game.announce = null;
  game.winner = null;
  sfx(game, "pause");
}

function updateClear(game, input, dt) {
  game.clearTimer -= dt;
  if (game.clearTimer <= 0 || confirmed(input)) advance(game);
}

function updateEnd(game, input) {
  if (confirmed(input) || backed(input)) {
    game.state = "title";
    game.menuIndex = 0;
    game.paused = false;
  }
}

function advance(game) {
  game.stageIndex += 1;
  if (game.stageIndex >= STAGES.length) {
    const bonus = game.roster.filter((r) => !r.cpu).reduce((sum, r) => sum + Math.max(0, r.lives), 0) * 1000;
    game.lifeBonus = bonus;
    addScore(game, bonus);
    game.state = "victory";
    sfx(game, "win");
    return;
  }
  buildLevel(game, STAGES[game.stageIndex]);
  enterIntro(game, "");
}

function updatePlay(game, input, dt) {
  if (game.announce) {
    game.announce.t -= dt;
    if (game.announce.t <= 0) game.announce = null;
  }
  game.shake = Math.max(0, game.shake - dt * 14);

  const prevTime = game.time;
  game.time -= dt;
  if (game.time < 11 && game.time > 0 && Math.ceil(game.time) !== Math.ceil(prevTime)) {
    sfx(game, "hurry");
  }
  if (game.time <= 0) {
    game.time = 0;
    if (game.mode === "battle") {
      if (!game.sudden) startSudden(game);
    } else if (!game.timeUpHandled) {
      game.timeUpHandled = true;
      timeUp(game);
      return;
    }
  }

  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 50 * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const f of game.floaters) {
    f.life -= dt;
    f.y += f.vy * dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);

  for (const p of game.players) {
    if (p.invuln > 0) p.invuln -= dt;
    if (p.bombCd > 0) p.bombCd -= dt;
    if (p.dying > 0) {
      p.dying -= dt;
      p.walk += dt * 14;
      if (p.dying <= 0) finishDeath(game, p);
    }
  }

  refreshPassers(game);

  for (const p of game.players) {
    if (!p.alive || p.out || p.dying > 0) continue;
    const action = p.cpu ? cpuAction(game, p, dt) : humanAction(p.slot, input);
    // Drop on the tile they still occupy, then walk off it.
    if (action.bomb) placeBomb(game, p);
    movePlayer(game, p, action, dt);
    if (action.deton) detonate(game, p);
    tryKick(game, p, action);
  }

  refreshPassers(game);
  updateBombs(game, dt);

  for (const ex of game.explosions) ex.age += dt;
  game.explosions = game.explosions.filter((ex) => ex.age < ex.life);

  for (const e of game.enemies) updateEnemy(game, e, dt);
  game.enemies = game.enemies.filter((e) => !e.dead || e.dying > 0);

  damageActors(game);
  updatePickups(game);
  checkRules(game);
}

function startSudden(game) {
  game.sudden = true;
  announce(game, "SUDDEN DEATH", 1.6);
  sfx(game, "hurry");
  for (const p of game.players) {
    if (!p.alive || p.out) continue;
    p.fire = Math.max(p.fire, 8);
    p.bombsMax = Math.max(p.bombsMax, 3);
  }
  for (const b of game.bombs) {
    b.armed = true;
    b.fire = Math.max(b.fire, 6);
    b.timer = Math.min(b.timer, 1);
  }
}

function timeUp(game) {
  sfx(game, "die");
  for (const p of game.players) {
    if (p.cpu || p.out) continue;
    p.lives -= 1;
    if (p.lives <= 0) {
      p.out = true;
      p.alive = false;
    }
    syncRoster(game, p);
  }
  if (game.players.filter((p) => !p.cpu).every((p) => p.out)) {
    game.state = "gameover";
    return;
  }
  buildLevel(game, STAGES[game.stageIndex]);
  enterIntro(game, "TIME UP");
}

function finishDeath(game, p) {
  p.dying = 0;
  if (game.mode === "battle" || p.lives <= 0) {
    p.out = true;
    p.alive = false;
    syncRoster(game, p);
    return;
  }
  const s = SPAWNS[p.slot];
  p.x = tileCenter(s.c);
  p.y = tileCenter(s.r);
  p.alive = true;
  p.invuln = 2.4;
  p.dir = "down";
  syncRoster(game, p);
}

function humanAction(slot, input) {
  const codes = slot === 0 ? P1 : P2;
  const axis = dominant(input.keys, input.order, codes);
  return {
    x: axis.x,
    y: axis.y,
    bomb: input.keys.has(codes.bomb),
    deton: input.keys.has(codes.deton),
  };
}

function dominant(keys, order, codes) {
  let x = (keys.has(codes.right) ? 1 : 0) - (keys.has(codes.left) ? 1 : 0);
  let y = (keys.has(codes.down) ? 1 : 0) - (keys.has(codes.up) ? 1 : 0);
  if (x && y) {
    for (let i = order.length - 1; i >= 0; i--) {
      const c = order[i];
      if (c === codes.left || c === codes.right) return { x, y: 0 };
      if (c === codes.up || c === codes.down) return { x: 0, y };
    }
    return { x, y: 0 };
  }
  return { x, y };
}

function movePlayer(game, p, action, dt) {
  const dist = playerSpeed(p) * dt;
  const mx = action.x || 0;
  const my = action.y || 0;
  if (mx) p.dir = mx > 0 ? "right" : "left";
  if (my) p.dir = my > 0 ? "down" : "up";
  p.moving = !!(mx || my);
  if (mx) stepAxis(game, p, mx * dist, 0);
  if (my) stepAxis(game, p, 0, my * dist);
  if (p.moving) p.walk += dt * 10;
  if (mx && Math.abs(centerDelta(p.y)) <= 1.25) {
    const ny = p.y + centerDelta(p.y);
    if (!blockedRect(game, p.x, ny, HALF, p)) p.y = ny;
  }
  if (my && Math.abs(centerDelta(p.x)) <= 1.25) {
    const nx = p.x + centerDelta(p.x);
    if (!blockedRect(game, nx, p.y, HALF, p)) p.x = nx;
  }
}

function stepAxis(game, p, dx, dy) {
  if (!dx && !dy) return;
  if (!blockedRect(game, p.x + dx, p.y + dy, HALF, p)) {
    p.x += dx;
    p.y += dy;
    return;
  }
  const horiz = dx !== 0;
  const delta = horiz ? centerDelta(p.y) : centerDelta(p.x);
  const limit = Math.abs(horiz ? dx : dy);
  if (delta !== 0 && Math.abs(delta) <= NUDGE) {
    const nudge = Math.sign(delta) * Math.min(Math.abs(delta), limit);
    const nx = p.x + (horiz ? 0 : nudge);
    const ny = p.y + (horiz ? nudge : 0);
    if (!blockedRect(game, nx, ny, HALF, p)) {
      p.x = nx;
      p.y = ny;
    }
    if (!blockedRect(game, p.x + dx, p.y + dy, HALF, p)) {
      p.x += dx;
      p.y += dy;
    }
  }
}

function blockedRect(game, x, y, half, p) {
  const c0 = tileOf(x - half);
  const c1 = tileOf(x + half - 0.001);
  const r0 = tileOf(y - half);
  const r1 = tileOf(y + half - 0.001);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (tileBlocks(game, c, r, p)) return true;
    }
  }
  return false;
}

function tileBlocks(game, c, r, p) {
  if (!Number.isFinite(c) || !Number.isFinite(r) || c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  const solid = game.map[r][c].solid;
  if (solid === "hard") return true;
  if (solid === "soft" && !p.wallPass) return true;
  const bomb = bombAt(game, c, r);
  if (bomb && !p.bombPass && !bomb.passers.has(p.slot)) return true;
  return false;
}

function overlapsTile(p, c, r) {
  const left = c * TILE;
  const top = r * TILE;
  return p.x + HALF > left && p.x - HALF < left + TILE && p.y + HALF > top && p.y - HALF < top + TILE;
}

function refreshPassers(game) {
  for (const bomb of game.bombs) {
    for (const slot of [...bomb.passers]) {
      const p = game.players.find((pl) => pl.slot === slot);
      if (!p || !p.alive || !overlapsTile(p, bomb.c, bomb.r)) bomb.passers.delete(slot);
    }
  }
}

function placeBomb(game, p) {
  if (p.bombCd > 0 || p.out || !p.alive) return;
  const c = tileOf(p.x);
  const r = tileOf(p.y);
  if (!inBounds(c, r)) return;
  if (game.map[r][c].solid !== "empty") return;
  if (bombAt(game, c, r)) return;
  const capacity = game.bombs.filter((b) => b.owner === p.slot && !b.spent).length;
  if (capacity >= p.bombsMax) return;
  const remote = p.remote && !game.sudden;
  game.bombs.push({
    owner: p.slot,
    c,
    r,
    x: tileCenter(c),
    y: tileCenter(r),
    fire: p.fire,
    timer: game.sudden ? 1.15 : FUSE,
    age: 0,
    remote,
    armed: !remote,
    spent: false,
    sliding: null,
    kicker: p.slot,
    kickGrace: 0,
    passers: new Set([p.slot]),
  });
  p.bombCd = 0.15;
  sfx(game, "place");
}

function detonate(game, p) {
  if (!p.remote || game.sudden) return;
  for (const b of game.bombs) {
    if (b.owner === p.slot && !b.spent && b.age > 0.12) {
      b.armed = true;
      b.timer = 0;
    }
  }
}

function tryKick(game, p, action) {
  if (!p.kick) return;
  let dir = null;
  if (action.x > 0) dir = "right";
  else if (action.x < 0) dir = "left";
  else if (action.y > 0) dir = "down";
  else if (action.y < 0) dir = "up";
  if (!dir) return;
  const d = DIRS[dir];
  const perp = dir === "left" || dir === "right" ? centerDelta(p.y) : centerDelta(p.x);
  if (Math.abs(perp) > 6) return;
  const bomb = bombAt(game, tileOf(p.x + d.x * (HALF + 3)), tileOf(p.y + d.y * (HALF + 3)));
  if (!bomb || bomb.sliding) return;
  bomb.sliding = dir;
  bomb.kicker = p.slot;
  bomb.kickGrace = 0.18;
  bomb.passers.add(p.slot);
  sfx(game, "kick");
}

function bombAt(game, c, r) {
  return game.bombs.find((b) => !b.spent && b.c === c && b.r === r);
}

function inBounds(c, r) {
  return Number.isFinite(c) && Number.isFinite(r) && c >= 0 && r >= 0 && c < COLS && r < ROWS;
}

function updateBombs(game, dt) {
  for (const bomb of game.bombs) {
    if (bomb.spent) continue;
    bomb.age += dt;
    if (bomb.kickGrace > 0) bomb.kickGrace -= dt;
    if (bomb.sliding) updateSlide(game, bomb, dt);
    if (!bomb.spent && touchesFlame(game, bomb.c, bomb.r)) {
      bomb.armed = true;
      bomb.timer = Math.min(bomb.timer, 0.02);
    }
    if (!bomb.armed) continue;
    bomb.timer -= dt;
  }
  const doomed = game.bombs.filter((b) => !b.spent && b.armed && b.timer <= 0);
  for (const bomb of doomed) explode(game, bomb);
  game.bombs = game.bombs.filter((b) => !b.spent);
}

function updateSlide(game, bomb, dt) {
  const d = DIRS[bomb.sliding];
  if (!d) return;
  const nx = bomb.x + d.x * 148 * dt;
  const ny = bomb.y + d.y * 148 * dt;
  const leadX = nx + d.x * (TILE * 0.5 - 0.01);
  const leadY = ny + d.y * (TILE * 0.5 - 0.01);
  const lc = tileOf(leadX);
  const lr = tileOf(leadY);
  if (lc !== bomb.c || lr !== bomb.r) {
    if (!tileFreeForBomb(game, lc, lr, bomb)) {
      bomb.sliding = null;
      bomb.x = tileCenter(bomb.c);
      bomb.y = tileCenter(bomb.r);
      return;
    }
  }
  bomb.x = nx;
  bomb.y = ny;
  bomb.c = tileOf(bomb.x);
  bomb.r = tileOf(bomb.y);
}

function tileFreeForBomb(game, c, r, bomb) {
  if (!inBounds(c, r)) return false;
  if (game.map[r][c].solid !== "empty") return false;
  const other = bombAt(game, c, r);
  if (other && other !== bomb) return false;
  for (const p of game.players) {
    if (!p.alive || p.out) continue;
    if (p.slot === bomb.kicker && bomb.kickGrace > 0) continue;
    if (tileOf(p.x) === c && tileOf(p.y) === r) return false;
  }
  return true;
}

function touchesFlame(game, c, r) {
  return game.explosions.some((ex) => ex.cells.some((cell) => cell.c === c && cell.r === r));
}

function trace(game, c, r, fire, apply) {
  const cells = [{ c, r, kind: "core", dir: "down" }];
  const softs = [];
  const chains = [];
  for (const dir of DIR_LIST) {
    const d = DIRS[dir];
    for (let i = 1; i <= fire; i++) {
      const nc = c + d.x * i;
      const nr = r + d.y * i;
      if (!inBounds(nc, nr)) break;
      const solid = game.map[nr][nc].solid;
      if (solid === "hard") break;
      const kind = i === fire ? "end" : "arm";
      const bomb = bombAt(game, nc, nr);
      if (bomb) {
        cells.push({ c: nc, r: nr, kind, dir });
        chains.push(bomb);
        break;
      }
      if (solid === "soft") {
        cells.push({ c: nc, r: nr, kind: "end", dir });
        softs.push([nc, nr]);
        break;
      }
      if (apply && game.map[nr][nc].item) game.map[nr][nc].item = null;
      cells.push({ c: nc, r: nr, kind, dir });
    }
  }
  return { cells, softs, chains };
}

function explode(game, bomb) {
  if (!bomb || bomb.spent) return;
  bomb.spent = true;
  bomb.sliding = null;
  const { cells, softs, chains } = trace(game, bomb.c, bomb.r, bomb.fire, true);
  for (const [c, r] of softs) destroySoft(game, c, r);
  game.explosions.push({
    id: game.nextId++,
    cells,
    age: 0,
    life: 0.5,
    owner: bomb.owner,
    kills: 0,
  });
  if (!game.reduceMotion) game.shake = Math.min(6, game.shake + 2.4);
  burst(game, bomb.x, bomb.y, ["#fff6d0", "#ffd24a", "#ff7a2a"], 10, 50);
  sfx(game, "explode");
  for (const other of chains) {
    if (other.spent) continue;
    other.armed = true;
    other.timer = Math.min(other.timer, CHAIN);
  }
}

function destroySoft(game, c, r) {
  const cell = game.map[r][c];
  if (!cell || cell.solid !== "soft") return;
  cell.solid = "empty";
  if (cell.exit) game.exitRevealed = true;
  addScore(game, 10);
  burst(game, tileCenter(c), tileCenter(r), ["#e09048", "#f2c08a", "#8a4a28"], 7, 34);
}

function updateEnemy(game, e, dt) {
  if (e.dead) {
    e.dying -= dt;
    return;
  }
  if (e.flash > 0) e.flash -= dt;
  e.walk += dt;
  let left = e.speed * dt;
  let guard = 0;
  while (left > 0 && guard++ < 4) {
    const dest = nextCenterPoint(e);
    const dc = tileOf(dest.x);
    const dr = tileOf(dest.y);
    if (!enemyWalk(game, e, dc, dr)) {
      e.dir = pickEnemyDir(game, e);
      const d = DIRS[e.dir];
      if (!enemyWalk(game, e, tileOf(e.x) + d.x, tileOf(e.y) + d.y)) break;
      continue;
    }
    const dist = Math.abs(dest.x - e.x) + Math.abs(dest.y - e.y);
    if (dist <= left) {
      e.x = dest.x;
      e.y = dest.y;
      left -= dist;
      if (Math.random() < e.turn || !canAhead(game, e)) e.dir = pickEnemyDir(game, e);
    } else {
      e.x += Math.sign(dest.x - e.x) * left;
      e.y += Math.sign(dest.y - e.y) * left;
      left = 0;
    }
  }
}

function nextCenterPoint(e) {
  const d = DIRS[e.dir] || DIRS.down;
  const c = tileOf(e.x);
  const r = tileOf(e.y);
  const cx = tileCenter(c);
  const cy = tileCenter(r);
  if (d.x > 0 && e.x < cx - 0.01) return { x: cx, y: cy };
  if (d.x < 0 && e.x > cx + 0.01) return { x: cx, y: cy };
  if (d.y > 0 && e.y < cy - 0.01) return { x: cx, y: cy };
  if (d.y < 0 && e.y > cy + 0.01) return { x: cx, y: cy };
  return { x: tileCenter(c + d.x), y: tileCenter(r + d.y) };
}

function enemyWalk(game, e, c, r) {
  if (!inBounds(c, r)) return false;
  const solid = game.map[r][c].solid;
  if (solid === "hard") return false;
  if (solid === "soft" && !e.phase) return false;
  if (bombAt(game, c, r)) return false;
  return true;
}

function canAhead(game, e) {
  const d = DIRS[e.dir];
  return enemyWalk(game, e, tileOf(e.x) + d.x, tileOf(e.y) + d.y);
}

function pickEnemyDir(game, e) {
  const c = tileOf(e.x);
  const r = tileOf(e.y);
  const options = DIR_LIST.filter((dir) => {
    const d = DIRS[dir];
    return enemyWalk(game, e, c + d.x, r + d.y);
  });
  if (!options.length) return e.dir;
  if (e.ai === "chase") {
    const toward = lineOfSight(game, e);
    if (toward && options.includes(toward)) return toward;
  }
  if (options.includes(e.dir) && Math.random() > e.turn) return e.dir;
  const forward = options.filter((dir) => dir !== REVERSE[e.dir]);
  const pool = forward.length ? forward : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

function lineOfSight(game, e) {
  const ec = tileOf(e.x);
  const er = tileOf(e.y);
  let best = null;
  let bestDist = 1e9;
  for (const p of game.players) {
    if (!p.alive || p.out || p.dying > 0) continue;
    const pc = tileOf(p.x);
    const pr = tileOf(p.y);
    if (pc !== ec && pr !== er) continue;
    const dx = Math.sign(pc - ec);
    const dy = Math.sign(pr - er);
    if (!dx && !dy) continue;
    let x = ec + dx;
    let y = er + dy;
    let blocked = false;
    while (x !== pc || y !== pr) {
      if (!inBounds(x, y) || game.map[y][x].solid !== "empty" || bombAt(game, x, y)) {
        blocked = true;
        break;
      }
      x += dx;
      y += dy;
    }
    if (blocked) continue;
    const dist = Math.abs(pc - ec) + Math.abs(pr - er);
    if (dist < bestDist) {
      bestDist = dist;
      best = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
    }
  }
  return best;
}

function damageActors(game) {
  for (const ex of game.explosions) {
    for (const p of game.players) {
      if (!p.alive || p.out || p.dying > 0 || p.invuln > 0) continue;
      if (ex.cells.some((cell) => cell.c === tileOf(p.x) && cell.r === tileOf(p.y))) {
        killPlayer(game, p, ex.owner);
      }
    }
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (ex.cells.some((cell) => cell.c === tileOf(e.x) && cell.r === tileOf(e.y))) {
        damageEnemy(game, e, ex);
      }
    }
  }
  for (const e of game.enemies) {
    if (e.dead) continue;
    for (const p of game.players) {
      if (!p.alive || p.out || p.dying > 0 || p.invuln > 0) continue;
      const reach = e.type === "brute" ? 12 : 10;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx * dx + dy * dy < reach * reach) killPlayer(game, p, null);
    }
  }
}

function killPlayer(game, p, bySlot) {
  if (!p.alive || p.dying > 0 || p.invuln > 0 || p.out) return;
  p.alive = false;
  p.dying = 0.9;
  if (game.mode === "normal") p.lives -= 1;
  if (game.mode === "battle" && bySlot != null && bySlot !== p.slot) {
    const owner = game.players.find((o) => o.slot === bySlot);
    if (owner) {
      owner.kills += 1;
      syncRoster(game, owner);
    }
  }
  syncRoster(game, p);
  burst(game, p.x, p.y, ["#fff", "#ffd0dc", "#ffd24a"], 8, 40);
  sfx(game, "die");
}

function damageEnemy(game, e, explosion) {
  if (e.dead || e.hitExplosions.has(explosion.id)) return;
  e.hitExplosions.add(explosion.id);
  if (e.hp > 1) {
    e.hp -= 1;
    e.flash = 0.35;
    e.speed += 18;
    burst(game, e.x, e.y, ["#fff", "#b7f27a"], 5, 28);
    return;
  }
  e.hp = 0;
  e.dead = true;
  e.dying = 0.42;
  explosion.kills += 1;
  const pts = e.points * explosion.kills;
  addScore(game, pts);
  floater(game, e.x, e.y - 6, String(pts), explosion.kills > 1 ? "#ffd45a" : "#fff");
  if (explosion.kills === 2) floater(game, e.x, e.y - 16, "CHAIN", "#ff8a3a");
  burst(game, e.x, e.y, ["#fff", "#ffd24a"], 6, 32);
}

function updatePickups(game) {
  for (const p of game.players) {
    if (!p.alive || p.out) continue;
    const c = tileOf(p.x);
    const r = tileOf(p.y);
    if (!inBounds(c, r)) continue;
    const cell = game.map[r][c];
    if (cell.solid !== "empty" || !cell.item) continue;
    const item = cell.item;
    cell.item = null;
    applyItem(p, item);
    addScore(game, 200);
    floater(game, p.x, p.y - 8, ITEM_LABEL[item] || "ITEM", "#ffe27a");
    burst(game, p.x, p.y, ["#ffe27a", "#fff"], 5, 26);
    sfx(game, "pickup");
  }
}

function applyItem(p, item) {
  if (item === "fire") p.fire = Math.min(8, p.fire + 1);
  else if (item === "bomb") p.bombsMax = Math.min(8, p.bombsMax + 1);
  else if (item === "speed") p.speedLevel = Math.min(5, p.speedLevel + 1);
  else if (item === "kick") p.kick = true;
  else if (item === "remote") p.remote = true;
  else if (item === "bombpass") p.bombPass = true;
  else if (item === "wallpass") p.wallPass = true;
  else if (item === "vest") p.invuln = Math.max(p.invuln, 8);
}

function checkRules(game) {
  if (game.mode === "battle") {
    if (game.players.some((p) => p.dying > 0)) return;
    const remaining = game.players.filter((p) => !p.out);
    if (remaining.length <= 1) {
      game.winner = remaining[0] || null;
      game.state = "battleend";
      sfx(game, "win");
    }
    return;
  }

  if (game.enemies.length === 0) {
    if (!game.exitUnlocked) {
      game.exitUnlocked = true;
      sfx(game, "open");
    }
    if (game.exitRevealed && !game.exitAnnounced) {
      game.exitAnnounced = true;
      announce(game, "EXIT OPEN");
    }
    const humans = game.players.filter((p) => !p.cpu && p.alive && !p.out && p.dying <= 0);
    if (game.exitRevealed && humans.some((p) => standingOnExit(game, p))) {
      const bonus = Math.ceil(game.time) * 10;
      game.clearBonus = bonus;
      addScore(game, bonus);
      game.state = "stageclear";
      game.clearTimer = 2.3;
      sfx(game, "clear");
    }
  }

  const humans = game.players.filter((p) => !p.cpu);
  if (humans.length && humans.every((p) => p.out) && humans.every((p) => p.dying <= 0)) {
    game.state = "gameover";
  }
}

function standingOnExit(game, p) {
  const c = tileOf(p.x);
  const r = tileOf(p.y);
  return inBounds(c, r) && game.map[r][c].exit && game.map[r][c].solid === "empty";
}

function walkableTile(game, p, c, r) {
  if (!inBounds(c, r)) return false;
  const solid = game.map[r][c].solid;
  if (solid === "hard") return false;
  if (solid === "soft" && !p.wallPass) return false;
  const bomb = bombAt(game, c, r);
  if (bomb && !p.bombPass && !bomb.passers.has(p.slot)) return false;
  return true;
}

function dangerSet(game) {
  const set = new Set();
  for (const ex of game.explosions) {
    for (const cell of ex.cells) set.add(`${cell.c},${cell.r}`);
  }
  const seen = new Set();
  const queue = game.bombs.filter((b) => !b.spent);
  while (queue.length) {
    const b = queue.pop();
    const id = `${b.c},${b.r}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const { cells, chains } = trace(game, b.c, b.r, b.fire, false);
    for (const cell of cells) set.add(`${cell.c},${cell.r}`);
    for (const other of chains) if (!other.spent) queue.push(other);
  }
  return set;
}

function blastSet(game, c, r, fire) {
  const set = new Set();
  const seen = new Set();
  const queue = [{ c, r, fire }];
  while (queue.length) {
    const b = queue.pop();
    const id = `${b.c},${b.r}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const traced = trace(game, b.c, b.r, b.fire, false);
    for (const cell of traced.cells) set.add(`${cell.c},${cell.r}`);
    for (const other of traced.chains) queue.push(other);
  }
  return set;
}

function dirBetween(c, r, nc, nr) {
  if (nc === c + 1) return "right";
  if (nc === c - 1) return "left";
  if (nr === r + 1) return "down";
  if (nr === r - 1) return "up";
  return null;
}

function bfsDir(game, p, c, r, isGoal, avoid) {
  const start = `${c},${r}`;
  const queue = [[c, r]];
  const prev = new Map([[start, null]]);
  while (queue.length) {
    const [x, y] = queue.shift();
    if ((x !== c || y !== r) && isGoal(x, y)) {
      let cur = `${x},${y}`;
      while (prev.get(cur) && prev.get(cur) !== start) cur = prev.get(cur);
      const [nx, ny] = cur.split(",").map(Number);
      return dirBetween(c, r, nx, ny);
    }
    for (const dir of DIR_LIST) {
      const d = DIRS[dir];
      const nx = x + d.x;
      const ny = y + d.y;
      const key = `${nx},${ny}`;
      if (prev.has(key)) continue;
      if (!walkableTile(game, p, nx, ny)) continue;
      if (avoid && avoid.has(key)) continue;
      prev.set(key, `${x},${y}`);
      queue.push([nx, ny]);
    }
  }
  return null;
}

function randomDir(game, p, c, r, avoid) {
  const options = DIR_LIST.filter((dir) => {
    const d = DIRS[dir];
    const nc = c + d.x;
    const nr = r + d.y;
    if (!walkableTile(game, p, nc, nr)) return false;
    if (avoid && avoid.has(`${nc},${nr}`)) return false;
    return true;
  });
  const pool = options.length ? options : DIR_LIST.filter((dir) => {
    const d = DIRS[dir];
    return walkableTile(game, p, c + d.x, r + d.y);
  });
  if (!pool.length) return null;
  if (p.ai.dir && pool.includes(p.ai.dir) && Math.random() < 0.55) return p.ai.dir;
  return pool[Math.floor(Math.random() * pool.length)];
}

function dirToAction(dir, extra = {}) {
  const d = dir ? DIRS[dir] : { x: 0, y: 0 };
  return { x: d.x, y: d.y, bomb: !!extra.bomb, deton: !!extra.deton };
}

function shouldDeton(game, p) {
  if (!p.remote || game.sudden) return false;
  for (const b of game.bombs) {
    if (b.owner !== p.slot || b.spent || b.age < 0.2) continue;
    const blast = blastSet(game, b.c, b.r, b.fire);
    const selfIn = blast.has(`${tileOf(p.x)},${tileOf(p.y)}`);
    const foeIn = game.players.some((o) => o.alive && !o.out && o.slot !== p.slot && blast.has(`${tileOf(o.x)},${tileOf(o.y)}`));
    if (foeIn && !selfIn) return true;
    if (b.age > 6 && !selfIn) return true;
  }
  return false;
}

function shouldPlace(game, p, danger) {
  if (p.bombCd > 0) return false;
  const c = tileOf(p.x);
  const r = tileOf(p.y);
  if (game.map[r][c].solid !== "empty" || bombAt(game, c, r)) return false;
  const capacity = game.bombs.filter((b) => b.owner === p.slot && !b.spent).length;
  if (capacity >= p.bombsMax) return false;
  const blast = blastSet(game, c, r, p.fire);
  const escape = DIR_LIST.some((dir) => {
    const d = DIRS[dir];
    const nc = c + d.x;
    const nr = r + d.y;
    const key = `${nc},${nr}`;
    return walkableTile(game, p, nc, nr) && !blast.has(key) && !danger.has(key);
  });
  if (!escape) return false;
  let useful = false;
  for (const key of blast) {
    const [x, y] = key.split(",").map(Number);
    if (!inBounds(x, y)) continue;
    if (game.map[y][x].solid === "soft") useful = true;
    for (const o of game.players) {
      if (o.slot === p.slot || !o.alive || o.out) continue;
      if (tileOf(o.x) === x && tileOf(o.y) === y) useful = true;
    }
  }
  if (!useful) return false;
  return Math.random() < 0.66;
}

function nearestFoe(game, p) {
  let best = null;
  let bestD = 1e9;
  for (const o of game.players) {
    if (o.slot === p.slot || !o.alive || o.out) continue;
    const d = Math.abs(tileOf(o.x) - tileOf(p.x)) + Math.abs(tileOf(o.y) - tileOf(p.y));
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best ? { foe: best, dist: bestD } : null;
}

function think(game, p) {
  const c = tileOf(p.x);
  const r = tileOf(p.y);
  const danger = dangerSet(game);
  const deton = shouldDeton(game, p);
  const here = `${c},${r}`;

  if (danger.has(here) || touchesFlame(game, c, r)) {
    const dir = bfsDir(game, p, c, r, (x, y) => !danger.has(`${x},${y}`) && !touchesFlame(game, x, y), null)
      || randomDir(game, p, c, r, null);
    return dirToAction(dir, { deton });
  }

  if (shouldPlace(game, p, danger)) {
    const blast = blastSet(game, c, r, p.fire);
    const escapes = DIR_LIST.filter((dir) => {
      const d = DIRS[dir];
      const nc = c + d.x;
      const nr = r + d.y;
      return walkableTile(game, p, nc, nr) && !blast.has(`${nc},${nr}`) && !danger.has(`${nc},${nr}`);
    });
    const dir = escapes.length
      ? escapes[Math.floor(Math.random() * escapes.length)]
      : randomDir(game, p, c, r, danger);
    return dirToAction(dir, { bomb: true, deton });
  }

  if (Math.random() < 0.72) {
    const dir = bfsDir(game, p, c, r, (x, y) => game.map[y][x].item && game.map[y][x].solid === "empty", danger);
    if (dir) return dirToAction(dir, { deton });
  }

  const near = nearestFoe(game, p);
  if (near && near.dist <= 8) {
    const fc = tileOf(near.foe.x);
    const fr = tileOf(near.foe.y);
    const dir = bfsDir(game, p, c, r, (x, y) => x === fc && y === fr, danger)
      || bfsDir(game, p, c, r, (x, y) => x === fc && y === fr, null);
    if (dir) return dirToAction(dir, { deton });
  }

  if (Math.random() < 0.8) {
    const dir = bfsDir(game, p, c, r, (x, y) => DIR_LIST.some((dirName) => {
      const d = DIRS[dirName];
      const nc = x + d.x;
      const nr = y + d.y;
      return inBounds(nc, nr) && game.map[nr][nc].solid === "soft";
    }), danger);
    if (dir) return dirToAction(dir, { deton });
  }

  if (near) {
    const fc = tileOf(near.foe.x);
    const fr = tileOf(near.foe.y);
    const dir = bfsDir(game, p, c, r, (x, y) => x === fc && y === fr, danger);
    if (dir) return dirToAction(dir, { deton });
  }

  return dirToAction(randomDir(game, p, c, r, danger), { deton });
}

function cpuAction(game, p, dt) {
  const centered = Math.abs(centerDelta(p.x)) < 3 && Math.abs(centerDelta(p.y)) < 3;
  if (centered) {
    const cx = tileCenter(tileOf(p.x));
    const cy = tileCenter(tileOf(p.y));
    if (!blockedRect(game, cx, cy, HALF, p)) {
      p.x = cx;
      p.y = cy;
    }
  }
  const moved = Math.abs(p.x - p.ai.lx) + Math.abs(p.y - p.ai.ly) > 0.15;
  p.ai.stuck = moved ? 0 : p.ai.stuck + dt;
  p.ai.lx = p.x;
  p.ai.ly = p.y;
  if (!centered && p.ai.dir && p.ai.stuck < 0.3) {
    return dirToAction(p.ai.dir, { deton: shouldDeton(game, p) });
  }
  const action = think(game, p);
  p.ai.dir = action.x > 0 ? "right" : action.x < 0 ? "left" : action.y > 0 ? "down" : action.y < 0 ? "up" : p.ai.dir;
  p.ai.stuck = 0;
  return action;
}
