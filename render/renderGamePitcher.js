import { $n, $t, $c, $a, $cl, on, randInt, hide, show, notifyBox } from '../util.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
import { endDefHalf, changeProcess, changeMode } from '../actions/game.js'
import { gamebox, renderGame, oppTeam } from './renderGame.js'
import { rerollScreen } from './renderGameReroll.js'
import { modScreen } from './renderGameMods.js'
import { buildOpp } from './buildOpp.js'
import { viewCard, viewOpp } from './modals/viewCard.js'
import { DICE } from '../dice/dice.js'
import { teams } from '../model/teams.js'
import { teamUnis, teamNames, leagueNames, evergreenJerseys } from '../dice/assets/teamColors.js'
const pitcherCard = $t("pitcher-card");
const offerPitcher = $t("offer-pitcher");

const PITCH_ACTION = {
  rerollOne: () => pitchReroll(1),
  rerollSet: () => pitchReroll(99),
  adjustOne: () => pitchMod(19),
  setOne: () => pitchMod(99),
  cancelOne: () => pitchCancel(1),
  cancelAll: () => pitchCancel(99),
  addD6: () => pitchAdd("d6"),
  addD10: () => pitchAdd("d10"),
}

export function initPitcher() {
  //subtract, reroll, mod, set, temp
  
  on(offerPitcher, "click", () => {
    changeProcess("pitch");
    playPitcher();
  });
  
  store.on("defense:rolled", () => {
      if (G.game.pitchAdd) {
        changeMode("remove");
        pitchRemove();
      }
      })
}
  export function playPitcher() {
    const ability = G.lineup.pitcher.ability
    PITCH_ACTION[ability]();
  }
  
  function pitchCancel(runsCancelled) {
    G.game.currentOutcome = Math.max(0,G.game.currentOutcome-runsCancelled);
    changeMode("outcome");
  }
  
  function pitchReroll(rerollAllowed) {
    changeMode("reroll");
    G.game.rerollAllowed = rerollAllowed;
    rerollScreen();
  }
  
  function pitchAdd(die) {
    G.game.pitchAdd = die;
    pitcherCard.classList.add("active", "btn-pulse");
    changeProcess("field");
    renderGame();
  }
  
  function pitchMod(changes){
    G.game.modAllowed = changes;
    modScreen();
  }
  
  export function pitchRemove() {
    notifyBox.show("Select one die to remove",0,false);
    G.game.rerollAllowed=1;
    
  }