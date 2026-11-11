import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
//import { modal } from '../main.js'
import { G } from '../model/game.js'
import { defaultSwingTable, defaultHitTable, defaultCritHitTable } from '../model/tables.js'

export const calculateTable = {
  swing: (batter) => calculateSwingTable(batter),
  critHit: (batter) => calculateCritHitTable(batter)
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