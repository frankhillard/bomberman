import { COLS, ROWS, TILE, HUD_H, VIEW_W, NAMES } from "./const.js";
import { drawText, drawTextCentered, measure } from "./font.js";

const THEMES = {
  grass: {
    floor: "#3aaa40",
    floorAlt: "#329638",
    speck: "#8ed45a",
    hard: "#8e95ad",
    hardDark: "#565d74",
    hardLight: "#d7dbeb",
    hardMid: "#6d758e",
    soft: "#d4783a",
    softDark: "#8a4520",
    softLight: "#f0b27a",
    mortar: "#6e381c",
    sky: "#143018",
  },
  sand: {
    floor: "#e0bc62",
    floorAlt: "#d2ac52",
    speck: "#f0d898",
    hard: "#a08b6e",
    hardDark: "#6e5a42",
    hardLight: "#e6d3b0",
    hardMid: "#8a7358",
    soft: "#c46a32",
    softDark: "#7a3c18",
    softLight: "#e8a06a",
    mortar: "#6a3418",
    sky: "#3a2a14",
  },
  ice: {
    floor: "#3f8fb8",
    floorAlt: "#3583ab",
    speck: "#b7e7f8",
    hard: "#5d7384",
    hardDark: "#2c4150",
    hardLight: "#d5e6ef",
    hardMid: "#3e5566",
    soft: "#e7eef3",
    softDark: "#5c7686",
    softLight: "#ffffff",
    mortar: "#3e5566",
    sky: "#163040",
  },
  castle: {
    floor: "#5c4e78",
    floorAlt: "#524468",
    speck: "#8a78a8",
    hard: "#6a6e80",
    hardDark: "#3c4050",
    hardLight: "#b0b4c4",
    hardMid: "#545868",
    soft: "#7a4468",
    softDark: "#4a243c",
    softLight: "#b07098",
    mortar: "#3a182c",
    sky: "#140c1c",
  },
};

const LOOKS = [
  { body: "#f4f0e6", trim: "#e23b3b", accent: "#3d7edb" },
  { body: "#2c2e3a", trim: "#f4f4f8", accent: "#6eb0ff" },
  { body: "#e4453c", trim: "#ffd15c", accent: "#f4f0e6" },
  { body: "#3a74e8", trim: "#f4f0e6", accent: "#ffd15c" },
];

const DOWN = [
  "................",
  ".......n........",
  ".......a........",
  "......ooo.......",
  ".....obbbbo.....",
  "....obbbbbbo....",
  "...obbbbbbbbo...",
  "...obbffffbbo...",
  "...obepppfebo...",
  "...obffffffbo...",
  "...obbbbbbbbo...",
  "....obbcbbbo....",
  "....ohh..hho....",
  "....ott..tto....",
  ".....o....o.....",
  "................",
];

const DOWN_STEP = [
  "................",
  ".......n........",
  ".......a........",
  "......ooo.......",
  ".....obbbbo.....",
  "....obbbbbbo....",
  "...obbbbbbbbo...",
  "...obbffffbbo...",
  "...obepppfebo...",
  "...obffffffbo...",
  "...obbbbbbbbo...",
  "....obbcbbbo....",
  "....ohh..hho....",
  "...ott....tto...",
  "...o........o...",
  "................",
];

const UP = [
  "................",
  ".......n........",
  ".......a........",
  "......ooo.......",
  ".....obbbbo.....",
  "....obbbbbbo....",
  "...obbbbbbbbo...",
  "...obbbbbbbbo...",
  "...obbbbbbbbo...",
  "...obbbbbbbbo...",
  "...obbbbbbbbo...",
  "....obbcbbbo....",
  "....ohh..hho....",
  "....ott..tto....",
  ".....o....o.....",
  "................",
];

const SIDE = [
  "................",
  ".......n........",
  ".......a........",
  "......ooo.......",
  ".....obbbbo.....",
  "....obbbbbbo....",
  "...obbbbbbbbo...",
  "...obbbfffbo....",
  "...obbbepfbo....",
  "...obbbfffbo....",
  "...obbbbbbbo....",
  "....obbcbbo.....",
  ".....ohhho......",
  "....ott.tto.....",
  "....o....o......",
  "................",
];

const SIDE_STEP = [
  "................",
  ".......n........",
  ".......a........",
  "......ooo.......",
  ".....obbbbo.....",
  "....obbbbbbo....",
  "...obbbbbbbbo...",
  "...obbbfffbo....",
  "...obbbepfbo....",
  "...obbbfffbo....",
  "...obbbbbbbo....",
  "....obbcbbo.....",
  ".....ohhho......",
  "...ott...tto....",
  "...o......o.....",
  "................",
];

const PUFF = [
  "................",
  "................",
  "......ooo.......",
  ".....oyyyyo.....",
  "....oyyyyyyo....",
  "...oyyyyyyyyo...",
  "...oyyeeeeyyo...",
  "...oyepepeyyo...",
  "...oyyyyyyyyo...",
  "....oyyyyyyo....",
  ".....oyyyyo.....",
  "......ooo.......",
  ".....ft..tf.....",
  "....oo....oo....",
  "................",
  "................",
];

const PUFF2 = [
  "................",
  "................",
  "......ooo.......",
  ".....oyyyyo.....",
  "....oyyyyyyo....",
  "...oyyyyyyyyo...",
  "...oyyeeeeyyo...",
  "...oyepepeyyo...",
  "...oyyyyyyyyo...",
  "....oyyyyyyo....",
  ".....oyyyyo.....",
  "......ooo.......",
  "......fttf......",
  "......oooo......",
  "................",
  "................",
];

const SKITTER = [
  "................",
  "....o......o....",
  ".....o....o.....",
  ".....oyyyyo.....",
  "....oyyyyyyo....",
  "...oyyyyyyyyo...",
  "...oyyeeeeyyo...",
  "...oyeppppeyo...",
  "...oyymmmmyyo...",
  "....oyyyyyyo....",
  ".....oyyyyo.....",
  "......fttf......",
  ".....oo..oo.....",
  "................",
  "................",
  "................",
];

const DART = [
  "................",
  ".......o........",
  "......ooo.......",
  ".....orrro......",
  "....orrrrro.....",
  "...orrrrrro.....",
  "...orreerro.....",
  "..orrepprreo....",
  "...orrrrrro.....",
  "....orrrrro.....",
  ".....orrro......",
  "......ooo.......",
  "......fttf......",
  "......o..o......",
  "................",
  "................",
];

const PHANTOM = [
  "................",
  "................",
  "......ooo.......",
  ".....ovvvvo.....",
  "....ovvvvvvo....",
  "...ovvvvvvvvo...",
  "...ovveeevvvo...",
  "...oveppepvo....",
  "...ovvvvvvvo....",
  "....ovvvvvvo....",
  "....ovv..vvo....",
  "...ovv....vvo...",
  "..ov........vo..",
  "..o..........o..",
  "................",
  "................",
];

const BRUTE = [
  "................",
  "..o..........o..",
  "..go...oo...og..",
  "..ogogggggogo...",
  "...oggggggggo...",
  "..oggggggggggo..",
  "..oggeeeegggo...",
  "..ogeepppeeggo..",
  "..ogggmmggggo...",
  "...oggggggggo...",
  "....oggccggo....",
  "....ohh..hho....",
  "....ott..tto....",
  ".....o....o.....",
  "................",
  "................",
];

function shade(color, amt) {
  const n = parseInt(color.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, v + amt));
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function luminance(color) {
  const n = parseInt(color.slice(1), 16);
  return ((n >> 16) * 3 + ((n >> 8) & 255) * 6 + (n & 255)) / 10;
}

function blit(ctx, x, y, rows, palette, flip = false) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === "." || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}

function bomberPalette(slot) {
  const look = LOOKS[slot] || LOOKS[0];
  const dark = luminance(look.body) < 80;
  return {
    o: dark ? "#e4e6f0" : "#1a1620",
    n: "#3a3228",
    a: look.trim,
    b: look.body,
    f: "#ffd0dc",
    e: dark ? "#f4f4f8" : "#1a1620",
    p: dark ? "#1a1620" : "#f7f7fb",
    c: look.accent,
    h: look.trim,
    t: look.trim,
  };
}

function enemyPalette(type) {
  if (type === "puff") {
    return { o: "#6a4a10", y: "#ffd24a", e: "#fff", p: "#1a1620", f: "#e23b3b", t: "#e23b3b" };
  }
  if (type === "skitter") {
    return { o: "#6a2810", y: "#f07830", e: "#fff", p: "#1a1620", m: "#7a1820", f: "#ffd15c", t: "#ffd15c" };
  }
  if (type === "dart") {
    return { o: "#6a1018", r: "#e23b3b", e: "#fff", p: "#1a1620", f: "#ffd15c", t: "#ffd15c" };
  }
  if (type === "phantom") {
    return { o: "#3a2468", v: "#b9a0f0", e: "#fff", p: "#24143c" };
  }
  return { o: "#143018", g: "#5cb048", e: "#fff", p: "#1a1620", m: "#8a2030", c: "#d0b050", h: "#e8d070", t: "#2a2418" };
}

function enemySprite(type, frame) {
  if (type === "puff") return frame ? PUFF2 : PUFF;
  if (type === "skitter") return SKITTER;
  if (type === "dart") return DART;
  if (type === "phantom") return PHANTOM;
  return BRUTE;
}

export function render(ctx, game) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (game.state === "title" || game.state === "help" || game.state === "mode" || game.state === "players" || game.state === "battlemenu") {
    drawMenu(ctx, game);
    return;
  }
  const theme = THEMES[game.stage?.theme] || THEMES.grass;
  const shake = game.reduceMotion ? 0 : Math.min(4, game.shake);
  const sx = shake ? Math.round(Math.sin(game.clock * 90) * shake) : 0;
  const sy = shake ? Math.round(Math.cos(game.clock * 70) * shake * 0.6) : 0;
  ctx.save();
  ctx.translate(sx, HUD_H + sy);
  drawWorld(ctx, game, theme);
  ctx.restore();
  drawHud(ctx, game);
  if (game.state === "intro") drawIntro(ctx, game);
  if (game.paused) drawPause(ctx, game);
  if (game.state === "stageclear") drawStageClear(ctx, game);
  if (game.state === "gameover") drawEndCard(ctx, "GAME OVER", [`SCORE ${pad(game.score, 6)}`, `BEST ${pad(game.best, 6)}`, "ENTER FOR TITLE"]);
  if (game.state === "victory") {
    drawEndCard(ctx, "YOU WIN", [
      game.lifeBonus ? `LIFE BONUS ${game.lifeBonus}` : "ALL WORLDS CLEAR",
      `SCORE ${pad(game.score, 6)}`,
      "ENTER FOR TITLE",
    ]);
  }
  if (game.state === "battleend") drawBattleEnd(ctx, game);
}

function drawWorld(ctx, game, theme) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawFloor(ctx, c, r, theme);
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = game.map[r]?.[c];
      if (!cell) continue;
      if (cell.exit && cell.solid === "empty") drawExit(ctx, c, r, game);
      if (cell.item && cell.solid === "empty") drawItem(ctx, c * TILE, r * TILE, cell.item, game.clock);
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const solid = game.map[r][c].solid;
      if (solid === "hard") drawHard(ctx, c * TILE, r * TILE, theme);
      else if (solid === "soft") drawSoft(ctx, c * TILE, r * TILE, theme, c, r);
    }
  }
  for (const bomb of game.bombs) drawBomb(ctx, bomb, game.clock);
  for (const e of game.enemies) drawEnemy(ctx, e, game);
  for (const p of game.players) drawPlayer(ctx, p, game);
  for (const ex of game.explosions) drawExplosion(ctx, ex);
  for (const part of game.particles) {
    ctx.globalAlpha = Math.max(0, part.life * 2);
    ctx.fillStyle = part.color;
    ctx.fillRect(Math.round(part.x), Math.round(part.y), part.size, part.size);
    ctx.globalAlpha = 1;
  }
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawText(ctx, f.text, Math.round(f.x - measure(f.text) / 2), Math.round(f.y), f.color);
    ctx.globalAlpha = 1;
  }
  if (game.announce && (game.state === "play" || game.state === "intro")) {
    drawBanner(ctx, game.announce.text, 96);
  }
}

function drawBanner(ctx, text, y) {
  const w = measure(text) + 20;
  const x = Math.round((VIEW_W - w) / 2);
  ctx.fillStyle = "#140e22";
  ctx.fillRect(x, y, w, 15);
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + 14, w, 1);
  ctx.fillRect(x, y, 1, 15);
  ctx.fillRect(x + w - 1, y, 1, 15);
  drawTextCentered(ctx, text, VIEW_W / 2, y + 4, "#ffe27a");
}

function drawFloor(ctx, c, r, theme) {
  ctx.fillStyle = (c + r) % 2 === 0 ? theme.floor : theme.floorAlt;
  ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  const h = (c * 17 + r * 31) % 7;
  ctx.fillStyle = theme.speck;
  if (h === 0) ctx.fillRect(c * TILE + 3, r * TILE + 11, 2, 1);
  if (h === 3) ctx.fillRect(c * TILE + 10, r * TILE + 5, 1, 1);
}

function drawHard(ctx, x, y, theme) {
  ctx.fillStyle = theme.hardDark;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = theme.hard;
  ctx.fillRect(x + 1, y + 1, 14, 13);
  ctx.fillStyle = theme.hardLight;
  ctx.fillRect(x + 1, y + 1, 14, 2);
  ctx.fillRect(x + 1, y + 1, 2, 12);
  ctx.fillStyle = theme.hardMid;
  ctx.fillRect(x + 4, y + 4, 8, 8);
  ctx.fillStyle = theme.hardLight;
  ctx.fillRect(x + 5, y + 5, 2, 2);
  ctx.fillRect(x + 10, y + 9, 2, 2);
}

function drawSoft(ctx, x, y, theme, c, r) {
  ctx.fillStyle = theme.softDark;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = theme.soft;
  ctx.fillRect(x + 1, y + 1, 14, 14);
  ctx.fillStyle = theme.mortar;
  for (let row = 0; row < 4; row++) {
    const yy = y + 1 + row * 4;
    ctx.fillRect(x + 1, yy, 14, 1);
    const shift = row % 2 === 0 ? 0 : 7;
    ctx.fillRect(x + 1 + shift, yy, 1, 4);
  }
  ctx.fillStyle = theme.softLight;
  ctx.fillRect(x + 2, y + 2, 4, 1);
  if ((c + r) % 3 === 0) {
    ctx.fillStyle = theme.softDark;
    ctx.fillRect(x + 8, y + 8, 2, 1);
  }
}

function drawExit(ctx, c, r, game) {
  const x = c * TILE;
  const y = r * TILE;
  const open = game.exitUnlocked;
  ctx.fillStyle = "#f0c14a";
  ctx.fillRect(x + 2, y + 1, 12, 14);
  ctx.fillStyle = open ? "#2450c8" : "#101828";
  ctx.fillRect(x + 4, y + 3, 8, 10);
  if (open && Math.floor(game.clock * 6) % 2 === 0) {
    ctx.fillStyle = "#d6ecff";
    ctx.fillRect(x + 6, y + 5, 4, 6);
  } else if (!open) {
    ctx.fillStyle = "#f0c14a";
    ctx.fillRect(x + 7, y + 6, 2, 3);
    ctx.fillRect(x + 6, y + 9, 4, 2);
  }
}

function drawItem(ctx, x, y, type, time) {
  const bob = Math.floor(time * 3) % 2;
  const colors = {
    fire: "#ff7a22",
    bomb: "#3a3a44",
    speed: "#3d7edb",
    kick: "#e23b3b",
    remote: "#7a4ad0",
    bombpass: "#2f9e6a",
    wallpass: "#d4783a",
    vest: "#f0f2f8",
  };
  ctx.fillStyle = "#1a1620";
  ctx.fillRect(x + 2, y + 3 + bob, 12, 11);
  ctx.fillStyle = Math.floor(time * 8) % 2 ? "#ffe27a" : "#fff";
  ctx.fillRect(x + 3, y + 4 + bob, 10, 9);
  ctx.fillStyle = colors[type] || "#fff";
  ctx.fillRect(x + 4, y + 5 + bob, 8, 7);
  ctx.fillStyle = "#1a1620";
  if (type === "fire") {
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(x + 7, y + 6 + bob, 2, 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 7, y + 7 + bob, 2, 1);
  } else if (type === "bomb") {
    ctx.fillStyle = "#f4f4f8";
    ctx.fillRect(x + 6, y + 6 + bob, 2, 1);
    ctx.fillRect(x + 8, y + 8 + bob, 2, 2);
  } else if (type === "speed") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 5, y + 8 + bob, 6, 2);
  } else if (type === "kick") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 5, y + 9 + bob, 5, 2);
  } else if (type === "remote") {
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(x + 7, y + 6 + bob, 1, 3);
    ctx.fillRect(x + 6, y + 8 + bob, 3, 2);
  } else if (type === "vest") {
    ctx.fillStyle = "#e23b3b";
    ctx.fillRect(x + 7, y + 7 + bob, 2, 2);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 8 + bob, 4, 1);
  }
}

function drawBomb(ctx, bomb, time) {
  const x = Math.round(bomb.x) - 8;
  const y = Math.round(bomb.y) - 8;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(x + 4, y + 13, 8, 2);
  const sprite = [
    "................",
    ".......n........",
    "......nsn.......",
    "......ooo.......",
    ".....ohhhho.....",
    "....ohhhhhho....",
    "...ohhhhhhhho...",
    "...ohhwhhhhho...",
    "...ohhhhhhhho...",
    "...ohhhhhhhho...",
    "....ohhhhhho....",
    ".....ohhhho.....",
    "......ooo.......",
    "................",
    "................",
    "................",
  ];
  const spark = Math.floor(time * (bomb.remote && !bomb.armed ? 4 : 14)) % 2;
  blit(ctx, x, y, sprite, {
    o: "#14141a",
    h: "#2a2a32",
    w: "#f4f6fb",
    n: "#6b4a28",
    s: spark ? (bomb.remote && !bomb.armed ? "#7ec8ff" : "#ffe14a") : "#ff7a2a",
  });
}

function drawPlayer(ctx, p, game) {
  if (p.out && p.dying <= 0) return;
  if (p.invuln > 0 && Math.floor(game.clock * (p.invuln > 3 ? 10 : 16)) % 2 === 0) return;
  const frame = p.moving || p.dying > 0 ? Math.floor(game.clock * 8 + p.slot) % 2 : 0;
  let dir = p.dir;
  if (p.dying > 0) {
    dir = DIR_BY_FRAME[Math.floor(p.walk) % 4];
  }
  const rows = dir === "up" ? UP : dir === "down" ? (frame ? DOWN_STEP : DOWN) : frame ? SIDE_STEP : SIDE;
  const flip = dir === "left";
  const x = Math.round(p.x) - 8;
  const y = Math.round(p.y) - 8 + (p.dying > 0 ? -2 : 0);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(x + 4, y + 14, 8, 2);
  blit(ctx, x, y, rows, bomberPalette(p.slot), flip);
}

const DIR_BY_FRAME = ["down", "left", "up", "right"];

function drawEnemy(ctx, e, game) {
  const frame = Math.floor(e.walk * (e.type === "dart" ? 10 : 6)) % 2;
  const x = Math.round(e.x) - 8;
  const y = Math.round(e.y) - 8 + (e.type === "phantom" ? Math.round(Math.sin(game.clock * 6 + e.x) * 1) : 0);
  ctx.save();
  if (e.dead) ctx.globalAlpha = Math.max(0, e.dying / 0.42);
  if (e.flash > 0 && Math.floor(game.clock * 20) % 2 === 0) ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + 4, y + 14, 8, 2);
  const flip = e.dir === "left";
  blit(ctx, x, y, enemySprite(e.type, frame), enemyPalette(e.type), flip);
  if (e.type === "brute" && e.hp < 3) {
    ctx.fillStyle = "#1a1620";
    ctx.fillRect(x + 5, y + 13, 6, 1);
    ctx.fillStyle = "#e23b3b";
    ctx.fillRect(x + 5, y + 13, e.hp * 2, 1);
  }
  ctx.restore();
}

function drawExplosion(ctx, ex) {
  const t = ex.age / ex.life;
  for (const cell of ex.cells) drawFlame(ctx, cell, t);
}

function drawFlame(ctx, cell, t) {
  const x = cell.c * TILE;
  const y = cell.r * TILE;
  const hot = t < 0.22;
  const fade = t > 0.72;
  const core = hot ? "#fffef6" : "#ffe9a0";
  const body = hot ? "#ffd24a" : t < 0.55 ? "#ff9a1e" : "#e85a18";
  const edge = t < 0.55 ? "#ff5a1a" : "#a82018";
  const horiz = cell.dir === "left" || cell.dir === "right";
  const rad = cell.kind === "core" ? (hot ? 6 : 7) : cell.kind === "end" ? 6 : 3;
  for (let j = -7; j <= 7; j++) {
    for (let i = -8; i <= 8; i++) {
      if (fade && (i + j + cell.c) % 2 === 0) continue;
      const man = Math.abs(i) + Math.abs(j);
      let draw = false;
      if (cell.kind === "arm") {
        const across = horiz ? Math.abs(j) : Math.abs(i);
        const along = horiz ? Math.abs(i) : Math.abs(j);
        draw = across <= 2 && along <= 8;
        if (!draw) continue;
        ctx.fillStyle = across === 0 ? core : across === 1 ? body : edge;
      } else {
        if (man > rad) continue;
        ctx.fillStyle = man <= 1 ? core : man >= rad - 1 ? edge : body;
      }
      ctx.fillRect(x + 8 + i, y + 8 + j, 1, 1);
    }
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = "#120e18";
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(0, HUD_H - 1, VIEW_W, 1);
  const stage = game.mode === "battle" ? "VS" : game.stage ? `${game.stage.world}-${game.stage.stage}` : "";
  const time = formatTime(game.time);
  const timeColor = game.time <= 30 && Math.floor(game.clock * 4) % 2 === 0 ? "#ff5a4a" : "#f4f0e6";
  drawText(ctx, `S ${pad(game.score, 6)}`, 2, 2, "#ffe27a");
  drawTextCentered(ctx, stage, VIEW_W / 2, 2, "#f4f0e6");
  drawText(ctx, time, VIEW_W - 2 - measure(time), 2, timeColor);

  if (game.mode === "battle") {
    game.players.forEach((p, i) => {
      const x = 4 + i * 58;
      ctx.fillStyle = p.out ? "#3a3a44" : LOOKS[p.slot].body;
      ctx.fillRect(x, 14, 6, 6);
      ctx.fillStyle = "#1a1620";
      ctx.fillRect(x, 14, 6, 1);
      const label = p.out ? "X" : String(p.kills);
      drawText(ctx, label, x + 8, 14, p.out ? "#6a6878" : "#f4f0e6");
    });
  } else {
    let x = 2;
    for (const p of game.players) {
      ctx.fillStyle = LOOKS[p.slot].trim;
      ctx.fillRect(x, 15, 5, 5);
      x += 7;
      const gear = `B${p.bombsMax} F${p.fire}`;
      drawText(ctx, gear, x, 14, "#f4f0e6");
      x += measure(gear) + 2;
      let flags = "";
      if (p.kick) flags += "K";
      if (p.remote) flags += "R";
      if (p.bombPass) flags += "P";
      if (p.wallPass) flags += "W";
      if (flags) {
        drawText(ctx, flags, x, 14, "#9ad0ff");
        x += measure(flags) + 3;
      }
      for (let i = 0; i < Math.max(0, p.lives); i++) drawHeart(ctx, x + i * 8, 14);
      x += Math.max(0, p.lives) * 8 + 8;
    }
  }
  if (game.muted) drawText(ctx, "M", VIEW_W - 8, 14, "#ff8a7a");
}

function drawHeart(ctx, x, y) {
  ctx.fillStyle = "#e23b3b";
  ctx.fillRect(x + 1, y + 1, 2, 2);
  ctx.fillRect(x + 4, y + 1, 2, 2);
  ctx.fillRect(x, y + 2, 7, 2);
  ctx.fillRect(x + 1, y + 4, 5, 1);
  ctx.fillRect(x + 2, y + 5, 3, 1);
  ctx.fillRect(x + 3, y + 6, 1, 1);
}

function drawIntro(ctx, game) {
  const stage = game.stage;
  ctx.fillStyle = "rgba(8,6,16,0.28)";
  ctx.fillRect(0, HUD_H, VIEW_W, ROWS * TILE);
  const lines = [game.mode === "battle" ? "BATTLE" : `WORLD ${stage.world}-${stage.stage}`, stage?.name || ""];
  if (game.extraBanner) lines.push(game.extraBanner);
  const h = 10 + lines.length * 12;
  const w = 150;
  const x = Math.round((VIEW_W - w) / 2);
  const y = HUD_H + Math.round((ROWS * TILE - h) / 2);
  ctx.fillStyle = "#140e22";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
  lines.forEach((line, i) => {
    const color = i === 0 ? "#ffe27a" : line === game.extraBanner ? "#ff8a7a" : "#f4f0e6";
    drawTextCentered(ctx, line, VIEW_W / 2, y + 6 + i * 12, color);
  });
}

function drawPause(ctx, game) {
  ctx.fillStyle = "rgba(8,6,16,0.72)";
  ctx.fillRect(0, HUD_H, VIEW_W, ROWS * TILE);
  drawTextCentered(ctx, "PAUSED", VIEW_W / 2, 96, "#ffe27a", 2);
  ["UNPAUSE", "RESIGN"].forEach((label, i) => {
    const y = 128 + i * 16;
    const on = i === game.menuIndex;
    if (on) blit(ctx, VIEW_W / 2 - measure(label) / 2 - 18, y - 4, DOWN, bomberPalette(0));
    drawTextCentered(ctx, label, VIEW_W / 2, y, on ? "#ffe27a" : "#f4f0e6");
  });
}

function drawStageClear(ctx, game) {
  ctx.fillStyle = "rgba(8,6,16,0.45)";
  ctx.fillRect(0, HUD_H, VIEW_W, ROWS * TILE);
  ctx.fillStyle = "rgba(8,6,16,0.9)";
  ctx.fillRect(24, 88, 192, 58);
  drawTextCentered(ctx, "STAGE CLEAR", VIEW_W / 2, 98, "#ffe27a");
  drawTextCentered(ctx, `TIME BONUS ${game.clearBonus}`, VIEW_W / 2, 112, "#f4f0e6");
  drawTextCentered(ctx, `SCORE ${pad(game.score, 6)}`, VIEW_W / 2, 124, "#9ad0ff");
}

function drawEndCard(ctx, title, lines) {
  ctx.fillStyle = "rgba(8,6,16,0.72)";
  ctx.fillRect(0, HUD_H, VIEW_W, ROWS * TILE);
  drawTextCentered(ctx, title, VIEW_W / 2, 86, "#ffe27a", 2);
  lines.forEach((line, i) => {
    drawTextCentered(ctx, line, VIEW_W / 2, 116 + i * 12, i === lines.length - 1 ? "#9ad0ff" : "#f4f0e6");
  });
}

function drawBattleEnd(ctx, game) {
  const title = game.winner ? `${NAMES[game.winner.slot]} WINS` : "DRAW";
  const lines = game.players.map((p) => `${NAMES[p.slot]}  K${p.kills}${p.cpu ? " CPU" : ""}`);
  lines.push("ENTER FOR TITLE");
  drawEndCard(ctx, title, lines.slice(0, 5));
}

function drawMenu(ctx, game) {
  ctx.fillStyle = "#1a1030";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((c + r) % 2 === 0) {
        ctx.fillStyle = "#22143c";
        ctx.fillRect(c * TILE, HUD_H + r * TILE, TILE, TILE);
      }
    }
  }
  if (game.state === "help") {
    drawHelp(ctx, game);
    return;
  }

  ctx.fillStyle = "#120c20";
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  drawText(ctx, `BEST ${pad(game.best, 6)}`, 4, 8, "#9ad0ff");
  if (game.muted) drawText(ctx, "MUTE", VIEW_W - 30, 8, "#ff8a7a");

  drawTextCentered(ctx, "BLASTERMAN", VIEW_W / 2, 36, "#3a2410", 2);
  drawTextCentered(ctx, "BLASTERMAN", VIEW_W / 2 - 1, 35, "#ffe27a", 2);
  drawTextCentered(ctx, "A 16-BIT MAZE BOMBER", VIEW_W / 2, 56, "#f4f0e6");

  const bob = Math.floor(game.clock * 6) % 2;
  blit(ctx, 28, 78 + bob, DOWN, bomberPalette(0));
  blit(ctx, 196, 78 + (bob ? 0 : 1), DOWN, bomberPalette(2));
  drawBomb(ctx, { x: 120, y: 96, remote: false, armed: true }, game.clock);

  let options = [];
  let title = "";
  if (game.state === "title") {
    options = ["START", "HOW TO PLAY"];
  } else if (game.state === "mode") {
    title = "MODE";
    options = ["ADVENTURE", "BATTLE"];
  } else if (game.state === "players") {
    title = "ADVENTURE";
    options = ["ONE PLAYER", "TWO PLAYERS"];
  } else if (game.state === "battlemenu") {
    title = "BATTLE";
    options = ["ONE VS CPU", "TWO VS CPU", "DUEL"];
  }
  if (title) drawTextCentered(ctx, title, VIEW_W / 2, 118, "#9ad0ff");
  options.forEach((label, i) => {
    const y = 136 + i * 16;
    const on = i === game.menuIndex;
    if (on) blit(ctx, VIEW_W / 2 - measure(label) / 2 - 18, y - 4, DOWN, bomberPalette(0));
    drawTextCentered(ctx, label, VIEW_W / 2, y, on ? "#ffe27a" : "#f4f0e6");
  });
  const hint = game.state === "title" ? "ENTER" : "ENTER  ESC BACK";
  if (Math.floor(game.clock * 2) % 2 === 0) drawTextCentered(ctx, hint, VIEW_W / 2, 206, "#9ad0ff");
}

function drawHelp(ctx, game) {
  ctx.fillStyle = "#120c20";
  ctx.fillRect(0, 0, VIEW_W, 20);
  drawTextCentered(ctx, "HOW TO PLAY", VIEW_W / 2, 6, "#ffe27a");
  const lines = [
    "ADVENTURE",
    "CLEAR EVERY FOE. BLOW OPEN THE",
    "EXIT AND STEP THROUGH IT.",
    "GEAR RESETS EACH NEW STAGE.",
    "",
    "BATTLE",
    "LAST BLASTER STANDING. THE",
    "MATCH ENDS IN SUDDEN DEATH.",
    "",
    "P1 ARROWS  SPACE BOMB  B DETONATE",
    "P2 WASD  F BOMB  G DETONATE",
    "PAD MOVE  A BOMB  B DET  START",
    "P PAUSE    M MUTE    ESC BACK",
    "FIRE  BOMB  SPEED  KICK  REMOTE",
    "BOMB PASS  WALL PASS  VEST",
  ];
  lines.forEach((line, i) => {
    const color = line === "ADVENTURE" || line === "BATTLE" ? "#9ad0ff" : "#f4f0e6";
    drawText(ctx, line, 8, 22 + i * 11, color);
  });
  if (Math.floor(game.clock * 2) % 2 === 0) drawTextCentered(ctx, "ENTER TO RETURN", VIEW_W / 2, 210, "#ffe27a");
}

function pad(n, width) {
  return String(Math.max(0, Math.floor(n))).padStart(width, "0");
}

function formatTime(t) {
  const s = Math.max(0, Math.ceil(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
