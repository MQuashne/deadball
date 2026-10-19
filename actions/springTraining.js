import { store } from '../model/store.js'
import { G } from '../model/game.js'

//=====================
//SPRING TRAINING / ALL STAR BREAK
//=====================

export function getProspects() {
  if (G.prospects.length === 0 && G.season === "spring") {
    for (let i = 1; i <= 3; i++) {
      let [prospectsOneSet, oppsOneSet] = getTwo(2);
      G.prospects.push(prospectsOneSet);
      G.opps.push(oppsOneSet)
    }
  } else return
}

export function nextRound() {
  store.update(state => {
    state.signRound++;
  }, ['signRound:changed'])
  
}

export function signPlayer(player, opp) {
  player.team = G.myTeam;
  if (player.fatigue) {
    store.update(state => {
      state.lineup.bullpen.push(player);
      state.fullRoster.push(player);
    }, [
      ["lineup:bullpen:add", player], "lineup:signing"
    ])
  } else {
    store.update(state => {
      state.lineup.bench.push(player);
      state.fullRoster.push(player);
    }, [
      ["lineup:bench:add", player], "lineup:signing"
    ]);
  }
  
  store.update(state => {
    state.opponents.push(opp);
  }, ["opponents:changed"])
  scheduleGame(opp);
  
  //renderCalendarEvents();
}

export function scheduleGame(opp) {
  store.update(state => {
    const nextGame = state.schedule.find(event => event.title === "TBD");
    nextGame.title = `${opp.city} ${opp.team}`;
  }, ["schedule:changed"]);
}

export function closeSpringTraining() {
  store.update(state => {
    state.season = "season";
    
    const stEvent = state.schedule.find(ev => ev.id === "springTraining")
    stEvent.status = "past";
    
    const g1 = state.schedule.find(ev => ev.id === "G1");
    g1.status = "active";
    
  }, ["schedule:changed", "spring:complete", "event:complete", "season:changed"]);
  
  
  
  /*UPDATE FROM NAV AND CALENDAR FILES. 
  $t("event-nav").dataset.section = "gameday";
  renderCalendarEvents();
  
  /*already done*/
  //Hide spring training content
  
}

function getTwo(tier) {
  //Get 2 players from the deck
  let pair = [];
  if (tier === 2) {
    store.update(G => {
      pair = G.tier2Deck.splice(0, 2)
    });
  } else if (tier === 3) {
    store.update(G => {
      pair = G.tier3Deck.splice(0, 2)
    });
  } else return
  
  //put their teams in another array
  const opps = [];
  pair.forEach((player) => {
    opps.push(G.league.find(opp => opp.code === player.team));
  })
  return [pair, opps]
}

//import {openSpringTraining,getProspects,nextRound,signPlayer,closeSpringTraining} from '../actions/springTraining.js'