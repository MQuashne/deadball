import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
//import { modal } from '../main.js'
import { G } from '../model/game.js'
import { valueFromHit, hitFromValue, hits, positions, defaultSwingTable, defaultHitTable, defaultCritHitTable, defaultDefenseTable } from '../model/tables.js'

export const calculateTable = {
  swing: (batter) => calculateSwingTable(batter),
  critHit: (batter) => calculateCritHitTable(batter),
  hit: (batter) => calculateHitTable(batter),
  def: (fielder, stat, runAdvance) => calculateDefenseTable(fielder,stat,runAdvance),
}

export function calculateSwingTable(batter) {
  const swingTable = structuredClone(defaultSwingTable);
  swingTable[3].max = batter.tempBT;
  swingTable[4].min = batter.tempBT + 1;
  swingTable[4].max = batter.tempOBT;
  swingTable[5].min = batter.tempOBT + 1;
  swingTable[5].max = batter.tempOBT + 5;
  swingTable[6].min = batter.tempOBT + 6;
  return swingTable;
}



export function calculateCritHitTable(batter) {
  const critHitTable = structuredClone(defaultCritHitTable);
  const pwrAdd = batter.P === "P++" ? 2 : batter.P === "P+" ? 1 : null;
  
  if (pwrAdd) {
    critHitTable.forEach((row) => {
      row.min = row.min === 1 ? 1 : row.min -= pwrAdd;
      row.max = row.max === 20 ? 20 : row.max -= pwrAdd;
    });
  }
  
  if (batter.S === "S+") {
    critHitTable.splice(0, 0, { min: 1, max: 1, def: "", runAdvance: 3, stat: "3B", outcome: "Triple" });
    critHitTable.splice(1, 0, { min: 2, max: 2, def: "", runAdvance: 3, stat: "HR", outcome: "In-Park HR" });
    critHitTable[2].min = 3;
  }
  return critHitTable;
}

export function calculateHitTable(batter) {
  const hitTable = structuredClone(defaultHitTable);
  const pwrMap = {
    "P++": 2,
    "P+": 1,
    "P-": -1,
    "P--": -2,
    "": 0
  }
  const pwrAdd = pwrMap[batter.P];
  
  if (pwrAdd) {
    hitTable.forEach((row) => {
      row.min -= pwrAdd;
      row.max -= pwrAdd;
    });
    hitTable.splice(0, hitTable.length, ...hitTable.filter((row) => row.max >= 1 && row.min <= 20));
    hitTable[0].min = 1;
    hitTable[hitTable.length - 1].max = 20;
  }
  
  if (batter.S === "S+" || batter.C === "C+") {
    const speedRows = [
      { min: 1, max: 1, def: "", runAdvance: 2, stat: "2B", outcome: "Double" },
      { min: 2, max: 2, def: "", runAdvance: 3, stat: "3B", outcome: "Triple" }
    ];
    const contactRow = { min: 1, max: 2, def: "", runAdvance: 2, stat: "2B", outcome: "Double" }
    
    const firstRowToKeep = hitTable.findIndex((row) => row.max >= 3);
    hitTable[firstRowToKeep].min = 3;
    if (batter.S === "S+") {
      hitTable.splice(0, firstRowToKeep, ...speedRows)
    } else {
      hitTable.splice(0, firstRowToKeep, contactRow)
    }
  }
  return hitTable
}

export function calculateDefenseTable(fielder, stat, runAdvance) {
  //console.log(stat + "CDT")
  const defenseTable = structuredClone(defaultDefenseTable);
  const defAdd = fielder.D === "D+" ? 1 : fielder.D === "D-" ? -1 : 0;
  defenseTable[0].stat = stat;
  defenseTable[0].outcome = `E${positions[fielder.fieldPos]} ${hits[stat].text} (Run+${runAdvance+1})`;
  defenseTable[0].runAdvance = runAdvance + 1;
  
  defenseTable[1].stat = stat;
  const runDif1 = runAdvance !== hits[stat].runnerBases ? ` (Runners +${runAdvance})` : "";
  defenseTable[1].outcome = `${hits[stat].text}${runDif1}`
  defenseTable[1].runAdvance = runAdvance;
  
  defenseTable[2].stat = valueFromHit[stat] === 1 ? stat : hitFromValue[valueFromHit[stat] - 1];
  defenseTable[2].runAdvance = runAdvance === 1 ? 1 : runAdvance - 1;
  const runDif2 = defenseTable[2].runAdvance !== hits[defenseTable[2].stat].runnerBases ? ` (Runners +${defenseTable[2].runAdvance})` : "";
  defenseTable[2].outcome = `${hits[defenseTable[2].stat].text}${runDif2}`;
  
  if (defAdd) {
    defenseTable.forEach((row) => {
      row.min -= defAdd;
      row.max -= defAdd;
    });
    defenseTable.splice(0, defenseTable.length, ...defenseTable.filter((row) => row.max >= 1 && row.min <= 12));
    defenseTable[0].min = 1;
    defenseTable[defenseTable.length - 1].max = 12;
  }
  return defenseTable
}