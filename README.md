# Blasterman

A 16-bit maze bomber inspired by the SNES Super Bomberman formula: grid mazes, cross-shaped blasts, chain reactions, and a battle mode for four.

This is an original game. It is not affiliated with Konami or Nintendo, and it does not use their art, music, or names.

## Play

```bash
npm start
```

Then open http://localhost:5173

## Modes

**Adventure** — twelve stages across four worlds. Clear every foe, blow open the exit, and step through it before the clock runs out. You keep your gear if you lose a life. Gear resets on the next stage. A time-up costs a life and rebuilds the stage.

**Battle** — last blaster standing. Play one against three CPUs, two players against two CPUs, or a duel. After two minutes the round goes to sudden death: fuses shorten and flames max out.

## Controls

| | Move | Bomb | Detonate |
| --- | --- | --- | --- |
| Player 1 | Arrow keys | Space | B |
| Player 2 | WASD | F | G |

P pauses. M mutes. Esc backs out of menus.

Remote bombs stay lit until you detonate them, or until a blast sets them off. The kick item sends a bomb sliding until it hits something.

## Power-ups

Fire, extra bombs, speed, kick, remote detonate, bomb pass, wall pass, and a vest that shrugs off hits for a few seconds.

## Tests

```bash
npm test
```
