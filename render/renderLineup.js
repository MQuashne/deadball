//mutations from lots of places get sent here to update this specific ui. 

import { $n, $t, $c, $a, $cl, on, randInt } from '../util.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
import { buildBar } from './buildLineupBar.js'
import { viewCard } from './modals/viewCard.js'
import { benchPlayer, benchPitcher, activatePlayer, activatePitcher, swapPlayers } from '../actions/lineup.js'

const table = $t("batter-order");
const startingPitcher = $t("starting-pitcher");
const bench = $t("bench");
const bullpen = $t("bullpen");

export function initLineup() {
  
  G.lineup.order.forEach((player) => {
    player.team = G.myTeam;
    table.append(buildBar(player));
  });
  G.lineup.bench.forEach((player) => {
    player.team = G.myTeam;
    bench.append(buildBar(player));
  });
  G.lineup.bullpen.forEach((player) => {
    player.team = G.myTeam;
    bullpen.append(buildBar(player));
  });
  G.lineup.pitcher.team = G.myTeam;
  startingPitcher.append(buildBar(G.lineup.pitcher));
  
  
  //Pure additions to the lineup - always in the bench or bullpen 
  store.on("lineup:changed", () => {
    updateButtons();
  })
  
  store.on("lineup:bullpen:add", (player) => {
    bullpen.append(buildBar(player));
  })
  
  store.on("lineup:bench:add", (player) => {
    bench.append(buildBar(player));
  })
  
  store.on("player:benched", (player) => {
    const bar = table.querySelector(`[data-pid="${player.id}"]`);
    bench.appendChild(bar);
    const space = $n('div', 'lineup-bar-space', table);
  })
  
  store.on("pitcher:benched", (pitcher) => {
    const bar = startingPitcher.querySelector(`[data-pid="${pitcher.id}"]`);
    bullpen.appendChild(bar);
    $n('div', 'lineup-bar-space', startingPitcher);
  })
  
  store.on("player:activated", (player) => {
    const bar = bench.querySelector(`[data-pid="${player.id}"]`);
    const firstSlot = table.querySelector(".lineup-bar-space");
    swapWithAnimation(bar, firstSlot);
    firstSlot.remove();
  })
  
  store.on("pitcher:activated", (pitcher) => {
    const bar = bullpen.querySelector(`[data-pid="${pitcher.id}"]`);
    const firstSlot = startingPitcher.querySelector(".lineup-bar-space");
    swapWithAnimation(bar, firstSlot);
    firstSlot.remove();
  })
  
  
  
  on(table, "click", (e) => {
    const bar = e.target.closest(".lineup-bar-wrap");
    const downBtn = e.target.closest(".btn-down");
    const upBtn = e.target.closest(".btn-up");
    const benchBtn = e.target.closest(".btn-bench");
    const startBtn = e.target.closest(".btn-start");
    if (bar) {
      const player = G.lineup.order.find((spot) => spot.id === bar.dataset.pid);
      const index = G.lineup.order.indexOf(player)
      if (upBtn) {
        const swapWith = bar.previousElementSibling;
        const p2 = G.lineup.order.find(p => p.id === swapWith.dataset.pid)
        swapPlayers(player, p2);
        swapWithAnimation(swapWith, bar);
        return;
      } else if (downBtn) {
        const swapWith = bar.nextElementSibling;
        const p2 = G.lineup.order.find(p => p.id === swapWith.dataset.pid)
        swapPlayers(player, p2);
        swapWithAnimation(swapWith, bar);
        return;
      } else if (benchBtn) {
        benchPlayer(player);
        return;
      } else if (bar) {
        viewCard(player);
        return;
      } else return;
    } else return
  });
  on(bench, "click", (e) => {
    const bar = e.target.closest(".lineup-bar-wrap");
    if (bar) {
      const startBtn = e.target.closest(".btn-start");
      const player = G.lineup.bench.find((spot) => spot.id === bar.dataset.pid);
      const index = G.lineup.bench.indexOf(player);
      if (startBtn) {
        activatePlayer(player);
        return;
      } else if (bar) {
        viewCard(player)
        return;
      } else return;
    } else return;
  })
  
  on(startingPitcher, "click", (e) => {
    const bar = e.target.closest(".lineup-bar-wrap");
    const benchBtn = e.target.closest(".btn-bench");
    const player = G.lineup.pitcher;
    if (benchBtn) {
      benchPitcher(player);
      return;
    } else if (bar) {
      viewCard(player)
      return;
    } else return;
  })
  
  on(bullpen, "click", (e) => {
    const bar = e.target.closest(".lineup-bar-wrap");
    const startBtn = e.target.closest(".btn-start");
    if (bar) {
      const player = G.lineup.bullpen.find((spot) => spot.id === bar.dataset.pid);
      const index = G.lineup.bullpen.indexOf(player);
      if (startBtn) {
        activatePitcher(player);
        return;
      } else if (bar) {
        viewCard(player)
        return;
      } else return;
    } else return;
  })
}

export function renderLineup(){
  table.replaceChildren();
  bench.replaceChildren();
  bullpen.replaceChildren();
  startingPitcher.replaceChildren();
  initLineup();
}

function updateButtons() {
  const startbars = table.querySelectorAll(".lineup-bar-wrap");
  const startLen = startbars.length;
  startbars.forEach((startbar) => {
    const pos = G.lineup.order.findIndex(p => p.id === startbar.dataset.pid);
    const up = startbar.querySelector('.btn-up');
    
    const down = startbar.querySelector('.btn-down');
    const bench = startbar.querySelector('.btn-bench');
    const start = startbar.querySelector('.btn-start');
    start.classList.add("hidden");
    bench.classList.remove("hidden");
    up.classList.remove("hidden");
    down.classList.remove("hidden");
    up.disabled = pos === 0 ? true : false
    down.disabled = pos === startLen - 1 ? true : false
  })
  const benchbars = bench.querySelectorAll('.lineup-bar-wrap');
  benchbars.forEach((sub) => {
    const btns = sub.querySelectorAll(".btn");
    btns.forEach((bt) => {
      bt.classList.add("hidden");
    });
    if (G.lineup.order.length < 9) {
      sub.querySelector(".btn-start").classList.remove("hidden");
    }
  })
  
  const bullpenbars = bullpen.querySelectorAll('.lineup-bar-wrap');
  bullpenbars.forEach((sub) => {
    const btns = sub.querySelectorAll(".btn");
    btns.forEach((bt) => {
      bt.classList.add("hidden");
    });
    if (!G.lineup.pitcher.id) {
      sub.querySelector(".btn-start").classList.remove("hidden");
    }
  })
  
  const spbars = startingPitcher.querySelectorAll('.lineup-bar-wrap');
  spbars.forEach((sub) => {
    const btns = sub.querySelectorAll(".btn");
    btns.forEach((bt) => {
      bt.classList.add("hidden");
    });
    sub.querySelector(".btn-bench").classList.remove("hidden");
  })
  
  
}

function swapWithAnimation(el1, el2) {
  const firstparent = el1.parentNode;
  const firstRect = el1.getBoundingClientRect();
  const secondParent = el2.parentNode;
  const secondRect = el2.getBoundingClientRect();
  const temp = $n("div");
  el1.before(temp);
  el2.before(el1);
  temp.replaceWith(el2);
  
  // DOM Swap
  /*
    if (el1.nextElementSibling === el2) {
      parent.insertBefore(el2, el1);
    } else if (el2.nextElementSibling === el1) {
      parent.insertBefore(el1, el2);
    }
    */
  // Invert
  const dx = firstRect.left - secondRect.left;
  const dy = firstRect.top - secondRect.top;
  
  el1.style.transform = `translate(${dx}px, ${dy}px)`;
  el2.style.transform = `translate(${-dx}px, ${-dy}px)`;
  
  // Play
  requestAnimationFrame(() => {
    el1.style.transition = 'transform 500ms ease';
    el2.style.transition = 'transform 500ms ease';
    el1.style.transform = '';
    el2.style.transform = '';
  });
  
  // Clean up transition styles after finish
  setTimeout(() => {
    el1.style.transition = '';
    el2.style.transition = '';
  }, 300);
}