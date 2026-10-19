import { modal } from '../main.js'
import { G } from '../model/game.js'
import { buildCard } from './buildCard.js'
import { buildOpp } from './buildOpp.js'
import { viewCard, viewOpp } from './modals/viewCard.js'
import { brandColors } from './brandColors.js'
import { teams } from '../model/teams.js'
import { $n, $t, $c, $a, on, findKey, loadCard, randInt } from '../util.js'
import { renderGame, initGame } from './renderGame.js'
import { playBall } from '../actions/game.js'

export function initCover() {
  on($t("btn-play-ball"), "click", () => {
  playBall();
  $t("gameday-cover").classList.add("hidden");
  $t("gameplay-content").classList.remove("hidden")
})
}

export function renderCover() {
  const awayLogo = $t("logo-away");
  const homeLogo = $t("logo-home");
  const logos = $t("logos");
  const uniSelectGD = $t("uni-select-gameday")
  const matchupTeams=$t("matchup-teams");
  const oppTeam=teams.find(t => t.code === G.opponents[G.gameNum - 1].code);
  
  const homeTeam = G.game.home ? G.thisTeam : oppTeam;
 const awayTeam = G.game.home ? oppTeam : G.thisTeam;
  
  matchupTeams.style.fontSize = "1.2rem";
  matchupTeams.style.texaAlign = "center";
  matchupTeams.innerHTML=`${awayTeam.city} <span style="font-family:proxima nova bold;">${awayTeam.name}</span><br><span style="font-size:1.2rem;">@</span><br>${homeTeam.city} <span style="font-family:proxima nova bold;">${homeTeam.name}</span>`
  
  awayLogo.src = `public/assets/logos/${awayTeam.tpLogo}.svg`;
  
  homeLogo.src = `public/assets/logos/${homeTeam.tpLogo}.svg`;
  
  logos.style.backgroundImage = `linear-gradient(150.64deg,${awayTeam.tp} 0%, ${awayTeam.tp} 49.99%, ${homeTeam.tp} 50%, ${homeTeam.tp} 100%)`

  G.game.home===true ? uniSelectGD.selectedIndex=0 : uniSelectGD.selectedIndex=1
  uniSelectGD.dispatchEvent(new Event('input'));
  
  $t('game-span').textContent = `GAME ${G.gameNum}`
  ;
  
}