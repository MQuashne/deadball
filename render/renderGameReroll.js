import { $n, $t, $c, $a, $cl, on, randInt, show, hide } from '../util.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
import { getOpponentOutcome, changeMode } from '../actions/game.js'
import { plays, gamebox, selectedDice, renderGame } from './renderGame.js'
const rollDisplay = $t('roll-display');
const outcomeDisplay = $t('roll-outcome');
const gameRoller = $t('gameRoller');
const mainRollBtn = $t("main-roll-btn");
//let selectedDice = [];
export let remainingDice = [];
export let remainingPlay;

export function initReroll() {
  on(gameRoller, "click", (ev) => {
    if (G.game.mode != "reroll" && G.game.mode != "remove") return;
    const rect = gameRoller.getBoundingClientRect();
    const chosen = gamebox.search_dice_by_mouse(ev, rect);
    if (!chosen) return;
    if (selectedDice.includes(chosen.notation_index)) {
      selectedDice.splice(selectedDice.indexOf(chosen.notation_index), 1);
      gamebox.set_dice_selected(chosen, false)
    } else {
      //how many allowed? 
      if (selectedDice.length < G.game.rerollAllowed) {
        selectedDice.push(chosen.notation_index);
        gamebox.set_dice_selected(chosen, true)
      }
    }
    selectedDice.length > 0 ? mainRollBtn.disabled = false : mainRollBtn.disabled = true;
    
    if (G.game.mode === "remove") {
      remainingDice = selectedDice.length > 0 ? G.game.currentRoll.toSpliced(selectedDice[0], 1) : [...G.game.currentRoll];
      outcomeDisplay.disabled = selectedDice.length <= 0;
      remainingPlay = getOpponentOutcome(remainingDice)
      outcomeDisplay.textContent= `${remainingPlay} RUNS`;
    }
  });
}

export function rerollScreen() {
  changeMode("reroll");
  rollDisplay.classList.add("mod-shift");
  mainRollBtn.classList.add("display-shift");
  mainRollBtn.disabled = true;
}

export function chooseDice() {
  
}