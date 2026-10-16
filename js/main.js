import { VIEW_W, VIEW_H } from "./const.js";
import { createGame, update } from "./game.js";
import { render } from "./draw.js";
import { Input } from "./input.js";
import { AudioBus } from "./audio.js";

const canvas = document.getElementById("screen");
const live = document.getElementById("live");
const ctx = canvas.getContext("2d");
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = createGame();
const input = new Input();
const audio = new AudioBus();
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
  if (input.keys.size) audio.unlock();
  update(game, input.snapshot(), dt);
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
