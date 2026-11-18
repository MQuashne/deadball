import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
//import { modal } from '../main.js'
import { G } from '../model/game.js'
import { calculateSwingTable, calculateCritHitTable, calculateTable } from '../actions/tables.js'



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
    build: (batter) => renderCritHitTable(batter, "critHit"),
    label: "Crit Hit"
  },
  hit: {
    build: (batter) => renderCritHitTable(batter, "hit"),
    label: "Hit"
  },
  def: {
    build: (fielder,stat,runAdvance) => renderDefenseTable(fielder,stat,runAdvance),
    label:"Defense"
  }
}

export function renderSwingTable(batter) {
  const tableFragment = fragmentFromString(`<table id="swing-table" class="result-table"><th class="roll-col">Roll</th><th class="result-col">Result</th></table>`);
  
  //const swingTable = calculateSwingTable(batter);
  const swingTable = calculateTable["swing"](batter)
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



export function renderCritHitTable(batter, table) {
  const tableFragment = fragmentFromString(`<table id="swing-table" class="result-table"><th class="roll-col">Roll</th><th class="result-col">Result</th></table>`);
  
  const critHitTable = calculateTable[table](batter);
  const critHitTableHtml = tableFragment.querySelector("table");
  
  critHitTable.forEach((res, index) => {
    const newRow = $n("tr", "", critHitTableHtml)
    const rollCell = $n("td", "roll-col", newRow);
    const roll = `${res.min}${res.max-res.min>0 ? `-${res.max}` : ""}`;
    rollCell.textContent = roll;
    const outcomeCell = $n("td", "", newRow);
    const runnerAdvance = ((res.stat === "1B" && res.runAdvance > 1) || (res.stat === "2B" && res.runAdvance > 2)) ? ` (Runners +${res.runAdvance})` : "";
    const def = res.def ? `, DEF(${res.def})` : ""
    outcomeCell.textContent = `${res.outcome}${runnerAdvance}${def}`;
  });
  return critHitTableHtml;
}

export function renderDefenseTable(fielder,stat,runAdvance) {
  const tableFragment = fragmentFromString(`<table id="swing-table" class="result-table"><th class="roll-col">Roll</th><th class="result-col">Result</th></table>`);
  
  const defenseTable = calculateTable["def"](fielder,stat,runAdvance);
  const defenseTableHtml = tableFragment.querySelector("table");
  
  defenseTable.forEach((res, index) => {
    const newRow = $n("tr", "", defenseTableHtml)
    const rollCell = $n("td", "roll-col", newRow);
    const roll = `${res.min}${res.max-res.min>0 ? `-${res.max}` : ""}`;
    rollCell.textContent = roll;
    const outcomeCell = $n("td", "", newRow);
    //const runnerAdvance = ((res.stat === "1B" && res.runAdvance > 1) || (res.stat === "2B" && res.runAdvance > 2)) ? ` (Runners +${res.runAdvance})` : "";
    //const def = res.def ? `, DEF(${res.def})` : ""
    outcomeCell.textContent = `${res.outcome}`;
  });
  return defenseTableHtml;
}