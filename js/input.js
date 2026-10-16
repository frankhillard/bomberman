const BLOCKED = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

export class Input {
  constructor(target = window) {
    this.keys = new Set();
    this.pressed = new Set();
    this.order = [];
    this.target = target;
    this._down = (e) => this.hold(e.code, e);
    this._up = (e) => this.release(e.code);
    this._blur = () => this.clear();
    target.addEventListener("keydown", this._down);
    target.addEventListener("keyup", this._up);
    target.addEventListener("blur", this._blur);
  }

  hold(code, event) {
    if (event && BLOCKED.has(code)) event.preventDefault();
    if (!this.keys.has(code)) {
      this.pressed.add(code);
      this.order = this.order.filter((c) => c !== code);
      this.order.push(code);
    }
    this.keys.add(code);
  }

  release(code) {
    this.keys.delete(code);
    this.order = this.order.filter((c) => c !== code);
  }

  clear() {
    this.keys.clear();
    this.order = [];
  }

  snapshot() {
    const snap = {
      keys: new Set(this.keys),
      pressed: new Set(this.pressed),
      order: this.order.slice(),
    };
    this.pressed.clear();
    return snap;
  }
}
