import { VIEW_W, VIEW_H } from "./const.js";
import { createGame, update } from "./game.js";
import { render } from "./draw.js";
import { Input } from "./input.js";
import { Gamepads } from "./gamepads.js";
import { AudioBus } from "./audio.js";

const canvas = document.getElementById("screen");
const live = document.getElementById("live");
const ctx = canvas.getContext("2d");
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = createGame();
const input = new Input();
const gamepads = new Gamepads();
const audio = new AudioBus();

const PAD_PLAYERS = [
  { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", bomb: "Space", deton: "KeyB" },
  { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", bomb: "KeyF", deton: "KeyG" },
];
game.audio = audio;
game.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PADS = [
  ["up", "ArrowUp"],
  ["left", "ArrowLeft"],
  ["down", "ArrowDown"],
  ["right", "ArrowRight"],
  ["bomb", "Space"],
  ["deton", "KeyB"],
  ["pause", "KeyP"],
];

for (const [name, code] of PADS) {
  const el = document.querySelector(`[data-pad="${name}"]`);
  if (!el) continue;
  const down = (e) => {
    e.preventDefault();
    input.hold(code);
  };
  const up = (e) => {
    e.preventDefault();
    input.release(code);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointerleave", up);
  el.addEventListener("pointercancel", up);
}

function fit() {
  const maxW = Math.min(window.innerWidth - 36, 960);
  const maxH = window.innerHeight - 150;
  const scale = Math.max(1, Math.floor(Math.min(maxW / VIEW_W, maxH / VIEW_H)));
  canvas.style.width = `${VIEW_W * scale}px`;
  canvas.style.height = `${VIEW_H * scale}px`;
}

window.addEventListener("resize", fit);
fit();

let lastStatus = "";
function syncStatus() {
  const stage = game.stage ? `${game.stage.name}` : "";
  let text = "Blasterman. Press enter to start.";
  if (game.state === "help") text = "How to play.";
  else if (game.state === "mode") text = "Choose adventure or battle.";
  else if (game.state === "intro") text = `${stage}. Get ready.`;
  else if (game.state === "play" && game.paused) text = "Paused.";
  else if (game.state === "play") text = `${stage}. Score ${game.score}.`;
  else if (game.state === "stageclear") text = `Stage clear. Score ${game.score}.`;
  else if (game.state === "gameover") text = `Game over. Score ${game.score}.`;
  else if (game.state === "victory") text = `You win. Score ${game.score}.`;
  else if (game.state === "battleend") text = game.winner ? `${["White", "Black", "Red", "Blue"][game.winner.slot]} wins.` : "Draw.";
  if (text !== lastStatus) {
    lastStatus = text;
    live.textContent = text;
  }
}

function tick(dt) {
  const pads = gamepads.poll();
  const snap = input.snapshot();
  if (snap.keys.size || pads.some((pad) => pad.active)) audio.unlock();
  update(game, withGamepads(snap, pads, game), dt);
  const musicOn = !game.paused && (game.state === "title" || game.state === "mode" || game.state === "players" || game.state === "battlemenu" || game.state === "play");
  audio.tick(dt, musicOn);
  render(ctx, game);
  syncStatus();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  requestAnimationFrame(frame);
}

function withGamepads(snap, pads, game) {
  const keys = new Set(snap.keys);
  const pressed = new Set(snap.pressed);
  const order = snap.order.slice();
  const playing = game.state === "play" || game.state === "intro";
  for (let slot = 0; slot < pads.length && slot < PAD_PLAYERS.length; slot++) {
    const pad = pads[slot];
    const bind = PAD_PLAYERS[slot];
    holdAxis(keys, pressed, order, bind.left, bind.right, pad.direction.x, pad.direction.pressedX);
    holdAxis(keys, pressed, order, bind.up, bind.down, pad.direction.y, pad.direction.pressedY);
    holdButton(keys, pressed, order, bind.bomb, pad.buttons.south);
    if (playing) holdButton(keys, pressed, order, bind.deton, pad.buttons.east);
    else if (pad.buttons.east.pressed) tap(pressed, order, "Escape");
    if (pad.buttons.start.pressed) tap(pressed, order, playing ? "KeyP" : "Enter");
    if (pad.buttons.select.pressed) tap(pressed, order, playing ? "KeyP" : "Escape");
    if (pad.buttons.north.pressed) tap(pressed, order, "KeyM");
  }
  return { keys, pressed, order };
}

function holdAxis(keys, pressed, order, negative, positive, value, justPressed) {
  const code = value < 0 ? negative : value > 0 ? positive : null;
  if (!code) return;
  const fresh = !keys.has(code);
  keys.add(code);
  if (fresh || justPressed) {
    pressed.add(code);
    remember(order, code);
  }
}

function holdButton(keys, pressed, order, code, button) {
  if (button.held) keys.add(code);
  if (button.pressed) {
    pressed.add(code);
    remember(order, code);
  }
}

function tap(pressed, order, code) {
  pressed.add(code);
  remember(order, code);
}

function remember(order, code) {
  const at = order.indexOf(code);
  if (at >= 0) order.splice(at, 1);
  order.push(code);
}

tick(0);
if (new URLSearchParams(location.search).has("step")) {
  window.__blaster = {
    game,
    step(dt = 1 / 60) {
      tick(dt);
    },
    hold(code) {
      input.hold(code);
    },
    release(code) {
      input.release(code);
    },
    releaseAll() {
      input.clear();
    },
  };
} else {
  requestAnimationFrame(frame);
}
