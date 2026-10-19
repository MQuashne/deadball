import { $n, $t, $c, $a, $cl, on, randInt, hide, show } from '../util.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
import { getOpponentOutcome, endDefHalf, endDefenseRoll } from '../actions/game.js'
import { gamebox, renderGame, oppTeam } from './renderGame.js'
import { buildOpp } from './buildOpp.js'
import { viewCard, viewOpp } from './modals/viewCard.js'
import { DICE } from '../dice/dice.js'
import { teams } from '../model/teams.js'
import { teamUnis, teamNames, leagueNames, evergreenJerseys } from '../dice/assets/teamColors.js'

const diceInput = $t("dice-input-border");
const pitcherCard = $t("pitcher-card");
const oppCard = $t("opp-card");

const offerPitcher = $t("offer-pitcher");
const defenseOutcome = $t("defense-outcome");
const diceCount = $t("dice-input-count");
const notifyBox = $t("notification");
let oppUni;
let defDiceCount;


export function initOpp() {
  
  oppUni = G.game.home ? evergreenJerseys[oppTeam.league][oppTeam.code]["Away"] : evergreenJerseys[oppTeam.league][oppTeam.code]["Home"];
 
  
  if (oppUni.stripe === "" || oppUni.stripe === oppUni.jersey) {
    document.documentElement.style.setProperty('--opp-die-bg-color', oppUni.jersey);
  } else {
    document.documentElement.style.setProperty('--opp-die-bg-color', `linear-gradient(90deg,${oppUni.jersey} 0%, ${oppUni.jersey} 5%, ${oppUni.stripe}a0 6%, ${oppUni.jersey} 7%, ${oppUni} 35%, ${oppUni.stripe}a0 36%, ${oppUni.jersey} 37%, ${oppUni.jersey} 65%, ${oppUni.stripe}a0 66%, ${oppUni.jersey} 67%, ${oppUni.jersey} 95%, ${oppUni.stripe}a0 96%, ${oppUni.jersey} 97%, ${oppUni.jersey} 100%)`)
  }
  
  document.documentElement.style.setProperty('--opp-die-font-color', oppUni.text);
  document.documentElement.style.setProperty('--opp-die-outline-color', oppUni.outline ||= "#ffffff00");
  
  oppCard.replaceChildren();
  oppCard.append(buildOpp(G.game.opponent));
  
  on(oppCard,"click",() => {
    viewOpp(G.game.opponent)
  });
  
  on(defenseOutcome, "click", () => {
    const runs = Number(defenseOutcome.textContent[0]);
    endDefHalf(runs);
  });
}

export function defenseHalf() {
  show([pitcherCard, oppCard])
    diceInput.querySelector(".die-box").classList.add("opp-die");
  
  //Show pitcher ability to add before the roll 
  if ((G.lineup.pitcher.ability === "addD6" || G.lineup.pitcher.ability === "addD10") && G.lineup.pitcher.used < G.lineup.pitcher.fatigue && !G.game.pitchAdd) {
    show(offerPitcher);
    offerPitcher.disabled=G.game.pitchesLeft<1;
  }
  
  //-------OPPONENT TEAM STYLING
  //CH:OPPSTYLE
  // If it's a place X roll Y, change dicebox styling
  
  $t("roll-surface").style.backgroundImage = `url("public/assets/logos/${oppTeam.code}.svg"), linear-gradient(90deg,oklch(from ${oppTeam.ts} calc(l - 0.12) c h),oklch(from ${oppTeam.ts} calc(l - 0.12) c h)) `;
  
  DICE.set_color('dice', oppUni.jersey);
  DICE.set_color('label', oppUni.text);
  DICE.set_color('stripe', oppUni.stripe ||= oppUni.jersey);
  DICE.set_color('outline', oppUni.outline ||= oppUni.jersey);
 
  renderGame();
}

export function opponentThrow() {
  defDiceCount = 0;
  if (G.game.opponent.result.test === "placeRoll") {
    defDiceCount = diceCount.textContent;
  } else { 
    defDiceCount = Number(G.game.opponent.dice.split("d")[0]);
  }
  if (G.game.pitchAdd === "d6") {
    defDiceCount+=1;
  }
  
  let diceSet = G.game.pitchAdd === "d10" ? `${defDiceCount}d6+1d10` : `${defDiceCount}d6`

gamebox.setDice(diceSet);
gamebox.start_throw(
  () => hide([diceInput, ...[...$a("main-roll")]]),
  (notation) => {
    endDefenseRoll(notation.result);
  });
  
}