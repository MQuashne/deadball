import { store } from '../model/store.js'
import { G } from '../model/game.js'
import { teams } from '../model/teams.js'
import { batters } from '../model/batters.js'
import { pitchers } from '../model/pitchers.js'

const trait_map = {
  "P+": "Power Hitter",
  "P++": "Elite Power Hitter",
  "C+": "Contact Hitter",
  "S+": "Speedy Runner",
  "D+": "Great Defender",
  "T+": "Tough Player",
  "P-": "Weak Hitter",
  "P--": "Extra Weak Hitter",
  "C-": "Free Swinger",
  "S-": "Slow Runner",
  "D-": "Poor Defender",
  "K+": "Strikeout Artist",
  "GB+": "Ground Ball Machine",
  "CN+": "Control Pitcher",
  "ST+": "Great Stamina",
  "CN-": "Wild"
}

const trait_values = {
  "P+": 1,
  "P++": 2,
  "C+": 1,
  "S+": 1,
  "D+": 0,
  "T+": 0,
  "P-": -1,
  "P--": -2,
  "C-": -1,
  "S-": -1,
  "D-": 0,
  "K+": 1,
  "GB+": 1,
  "CN+": 1,
  "ST+": 0,
  "CN-": -1
}

const pd_map = {
  "-D20": 0,
  "-D12": 1,
  "-D8": 2,
  "-D4": 3,
  "D4": 4,
  "D8": 5,
  "D12": 6,
  "D20": 7
}

const pd_value = {
    "-D20": 0,
  "-D12": 7,
  "-D8": 11,
  "-D4": 15,
  "D4": 23,
  "D8": 26,
  "D12": 31,
  "D20": 38
}



export function defaultLineup(team) {
  const order = batters.filter((b) => b.team === team && b.defaultOrder !== "B" && b.defaultOrder !== "R").sort((a, b) => a.defaultOrder - b.defaultOrder);
  
  const bench = batters.filter((b) => b.team === team && b.defaultOrder === "B");
  
  const batterReserve = batters.filter((b) => b.team === team && b.defaultOrder === "R");
  
  const rotation = pitchers.filter((p) => p.team === team && p.defaultStartingRotation !== "B" && p.defaultStartingRotation !== "R").sort((a, b) => a.defaultStartingRotation - b.defaultStartingRotation);
  
  const bullpen = pitchers.filter((p) => p.team === team && p.defaultReliefRotation !== "S" && p.defaultReliefRotation !== "R").sort((a, b) => a.defaultReliefRotation - b.defaultReliefRotation);
  
  const pitcherReserve = pitchers.filter((p) => p.team === team && p.defaultReliefRotation === "R");
  
  const pitcher = rotation[0];
  
  order.forEach(pl => {
    pl.fieldPos = pl.defaultPos;
  });
  console.log([...rotation, ...bullpen, ...pitcherReserve, pitcher]);
  [...rotation, ...bullpen, ...pitcherReserve, pitcher].forEach((pi) => {
    //console.log(pi)
    pi.ip = 0;
    pi.handBonus = false;
    pi.pdValue = pd_map[pi.PD];
    pi.tempPD = pi.PD;
    pi.tempPdValue = pd_map[pi.tempPD];
    pi.traitsLong = [];
    pi.gameStats=[];
    let val=pd_value[pi.PD];
    pi.traits.forEach((tr) => {
      pi.traitsLong.push(trait_map[tr]);
      val+=trait_values[tr]*5;
    });
    pi.restNeeded = 0;
    if (pi.type === "SP") {
      pi.PV = val>=31 ? "PV+" : val<=11 ? "PV-" : "";
    } else {
      pi.PV = val>=37 ? "PV+" : val<=2 ? "PV-" : "";
    }
  });
  
  [...order, ...bench, ...batterReserve].forEach((ba) => {
    ba.tempBT = ba.BT;
    ba.tempOBT = ba.OBT;
    ba.traitsLong = [];
    ba.gameStats=[];
    let val = ba.BT;
    ba.traits.forEach((tr) => {
      ba.traitsLong.push(trait_map[tr])
      val+=(5*trait_values[tr])
    });
    ba.BV = val>=31 ? "BV+" : val<=15 ? "BV-" : "";
    
  })
  
  return {
    order,
    bench,
    batterReserve,
    rotation,
    bullpen,
    pitcherReserve,
    pitcher
  }
}

export function rosterTeams() {
  teams.filter(tm => tm.league === "MLB").forEach((team) => {
    team.lineup = defaultLineup(team.code);
    team.currentBatterIndex = 0;
    team.currentRotationIndex = 0;
  });
  
}
/*
export function benchPlayer(player){
  store.update(state => {
    state.lineup.bench.push(player)
    const index=state.lineup.order.indexOf(player);
    state.lineup.order.splice(index,1);
  },[["player:benched",player],"lineup:changed"]);
}

export function benchPitcher(pitcher){
  store.update(state => {
    state.lineup.bullpen.push(pitcher);
    state.lineup.pitcher={};
  },[["pitcher:benched",pitcher],"lineup:changed"]);
}

export function activatePlayer(player){
  store.update(state => {
    state.lineup.order.push(player);
    const index=state.lineup.bench.indexOf(player);
    state.lineup.bench.splice(index,1);
  },[["player:activated",player],"lineup:changed"]);
}

export function activatePitcher(pitcher){
  store.update(state => {
    state.lineup.pitcher = pitcher;
    const index=state.lineup.bullpen.indexOf(pitcher);
    state.lineup.bullpen.splice(index,1);
  },[["pitcher:activated",pitcher],"lineup:changed"]);
}

export function swapPlayers(p1,p2){
  store.update(state => {
    const i1 = state.lineup.order.indexOf(p1);
    const i2 = state.lineup.order.indexOf(p2);
    [state.lineup.order[i1],state.lineup.order[i2]] = [state.lineup.order[i2],state.lineup.order[i1]];
  },[["order:reordered",{p1,p2}],"lineup:changed"]);
}
*/