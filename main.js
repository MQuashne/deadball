import { players } from './model/players.js'
import {colorSetup} from './control/colorControl.js'
import { DICE } from './dice/dice.js'
import { gameSetup } from './control/setup.js'
import Modal from './render/modal.js'
import {renderStart} from './render/renderStart.js'

const $t = id => document.getElementById(id);
const $c = id => document.querySelector(`.${id}`);
const on = (el, event, cb) => el.addEventListener(event, cb);

/*console.log(players.length)
let result = players[12].bat([1, 6, 3, 4]);
const resultDiv = document.getElementById('result');
const nameDiv = document.getElementById('name');
nameDiv.textContent = players[12].name;
resultDiv.textContent = result;
*/

//Create Modal
export const modal = new Modal;







//--TEAM AND COLOR SELECT--
//gameSetup()
renderStart();
