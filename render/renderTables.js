import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
//import { modal } from '../main.js'
import { G } from '../model/game.js'
import { calculateSwingTable, calculateCritHitTable } from '../actions/tables.js'



function fragmentFromString(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  return template.content; // This is a DocumentFragment
}



export const renderTable = {
  swing: {
    build: (batter) => renderSwingTable(batter),
    label: "Swing"
  },
  critHit: {
    build: (batter) => renderCritHitTable(batter), 
    label: "Crit Hit"
  }
}

export function renderSwingTable(batter) {
  const tableFragment = fragmentFromString(`<table id="swing-table" class="result-table"><th class="roll-col">Roll</th><th class="result-col">Result</th></table>`);

  const swingTable = calculateSwingTable(batter);
  const swingTableHtml = tableFragment.querySelector("table");
  swingTableHtml.querySelector(".roll-col").textContent = "MSS";
  swingTable.forEach((res, index) => {
    const newRow = $n("tr", "", swingTableHtml)
    const rollCell = $n("td", "roll-col", newRow);
    const roll = (() => {
      switch (index) {
        case 0:
          return "<1";
        case 10:
          return "100+";
        default:
          return `${res.min}${res.max-res.min>0 ? `-${res.max}` : ""}`;
      }
    });
    rollCell.textContent = roll();
    const outcomeCell = $n("td", "", newRow);
    outcomeCell.textContent = res.outcome;
  });
  return swingTableHtml;
}



export function renderCritHitTable(batter) {
  const tableFragment = fragmentFromString(`<table id="swing-table" class="result-table"><th class="roll-col">Roll</th><th class="result-col">Result</th></table>`);
  
  const critHitTable = calculateCritHitTable(batter);
  const critHitTableHtml = tableFragment.querySelector("table");
  
  critHitTable.forEach((res, index) => {
    const newRow = $n("tr", "", critHitTableHtml)
    const rollCell = $n("td", "roll-col", newRow);
    const roll = `${res.min}${res.max-res.min>0 ? `-${res.max}` : ""}`;
    rollCell.textContent = roll;
    const outcomeCell = $n("td", "", newRow);
    outcomeCell.textContent = res.outcome === "Double" ? `${res.outcome} (Run +${res.runAdvance})` : res.outcome;
  });
  return critHitTableHtml;
}