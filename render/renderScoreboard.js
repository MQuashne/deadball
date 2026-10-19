import { G } from '../model/game.js'
import { $n, $t, $c, on, $cl } from '../util.js'

export function scoreboardTable(home, away) {
  const board = $n("div");
  board.id = "scoreboard";
  const headRow = $n("div", "sb-grid", board);
  const awayRow = $n("div", "sb-grid", board);
  const homeRow = $n("div", "sb-grid", board);
  for (let i = 0; i < Math.max(11, G.game.inning + 2); i++) {
    const headEl = $n("div", "sb-hcell", headRow);
    const awayEl = $n("div", "sb-cell", awayRow);
    const homeEl = $n("div", "sb-cell", homeRow);
    if (i === 0) {
      headEl.classList.add("left");
      awayEl.classList.add("left");
      homeEl.classList.add("left");
      
      awayEl.innerHTML = `<span>${away.name}</span>`;
      homeEl.innerHTML =`<span>${home.name}</span>`
    } else if (i === Math.max(10, G.game.inning + 1)) {
      headEl.textContent = "R";
      awayEl.textContent = G.game.score[0];
      homeEl.textContent = G.game.score[1];
      headEl.classList.add("total");
      awayEl.classList.add("total");
      homeEl.classList.add("total");
    } else {
      headEl.textContent = i;
      if (i <= G.game.inning) {
        awayEl.textContent = G.game.scoreboard[i - 1][0].runs;
        if (i === G.game.inning + (G.game.half - 1) / 2) {awayEl.classList.add("active")}
      }
      if (i+0.5 <= G.game.inning + (G.game.half - 1) / 2) {
        homeEl.textContent = G.game.scoreboard[i - 1][1].runs;
        if (i+0.5 === G.game.inning + (G.game.half - 1) / 2) {homeEl.classList.add("active")}
      }
    }
  }
  return board
}