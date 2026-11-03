import { store } from '../model/store.js'
import { G } from '../model/game.js'
import { teams } from '../model/teams.js'
import { batters } from '../model/batters.js'
import { pitchers } from '../model/pitchers.js'

export function defaultLineup(team) {
  
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