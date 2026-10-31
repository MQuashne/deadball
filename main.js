/*import { players } from './model/players.js'
import {colorSetup} from './control/colorControl.js'
*/
import { DICE } from './dice/dice.js'
/*import { gameSetup } from './control/setup.js'
import Modal from './render/modal.js'
import {renderStart} from './render/renderStart.js'
*/

import { $n, $t, $c, $a, $cl, on, randInt, findKey } from '../util.js'

const ari_away = {
  "jersey": "#A29E9F",
  "stripe": "",
  "text": "#A6192E",
  "outline": "#1F1F1F"
}

const phi_home = {
  "jersey": "#FFFFFF",
  "stripe": "#BA0C2F",
  "text": "#BA0C2F",
  "outline": "#F5F5F5"
}

const gameRoller = $t("gameRoller");
const box = new DICE.dice_box(gameRoller);
box.setDice("1d100+1d10+1d8");
box.setPalettes([phi_home, phi_home, ari_away]);
const sacButton = $t('sac-btn');
on(sacButton, 'click', () => {
  box.start_throw();
});

/*console.log(players.length)
let result = players[12].bat([1, 6, 3, 4]);
const resultDiv = document.getElementById('result');
const nameDiv = document.getElementById('name');
nameDiv.textContent = players[12].name;
resultDiv.textContent = result;
*/

//Create Modal
//export const modal = new Modal;







//--TEAM AND COLOR SELECT--
//gameSetup()
//renderStart();