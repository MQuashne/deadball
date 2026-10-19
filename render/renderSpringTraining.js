import { $n, $t, $c, $a, $cl, on, randInt } from '../util.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
import { buildCard } from './buildCard.js'
import { buildOpp } from './buildOpp.js'
import { viewCard, viewOpp } from './modals/viewCard.js'
import { allPlayers } from '../control/setup.js'
import {initLineup} from './renderLineup.js';
import {renderCover} from './renderGameday.js'
import { getProspects, nextRound, signPlayer, closeSpringTraining } from '../actions/springTraining.js'

//All elements used
const titleSec = $t("st-title-sec");
const rosTitleSec = $t('st-ros-title');
const signInstSec = $t("st-sign-inst");
const chooseSec = $t("st-sign-sec");
const closeSec = $t("st-close-sec");
const outTr = $t('st-tr-out');
const linScroll = $t('st-lineup-scroll');
const meetButton = $t("meet-team");
const prospectButton = $t("st-choose-btn");
const springTrainingContent = $t("spring-training-content");
const cardStage = $t("st-card-stage");
const flipScenes = [...cardStage.querySelectorAll(".card-scene")];
const flipButton = $t("st-flip-btn");
const signButton = $t("st-sign-btn");
const closeButton = $t("st-close-btn");
const gamedayContent = $t('gameday');

let currentProspect = 0;

export function initSpringTraining() {
  
  //initial sections to show
  titleSec.classList.add("open");
  [rosTitleSec, signInstSec, chooseSec, closeSec].forEach(sect => sect.classList.remove("open"));
  outTr.classList.add("hidden");
  
  //populate roster trough
  linScroll.replaceChildren();
  const fullRoster = [...G.lineup.order, G.lineup.pitcher];
  fullRoster.forEach((player, i) => {
    addToLineup(player, i, fullRoster);
  });
  
  //Get Prospects
  getProspects();
  
  //Button handlers
  on(meetButton, "click", () => {
    nextRound();
    //goes from -1 (pre-meet) to 0 (see roster)
  });
  
  //open player card modal on tap
  on(outTr, "click", (e) => {
    const pcard = e.target.closest(".lineup-card");
    const player = allPlayers.find((spot) => spot.id === pcard.dataset.pid);
    viewCard(player);
  });
  
  //open player or opponent card on prospect tap 
  on(cardStage, "click", (e) => {
    const pcard = e.target.closest(".front");
    const ocard = e.target.closest(".back");
    if (!pcard && !ocard) return;
    
    if (pcard) {
      const player = allPlayers.find((spot) => spot.id === pcard.dataset.pid);
      viewCard(player);
    };
    if (ocard) {
      const opp = G.league.find((spot) => spot.id === ocard.dataset.pid);
      viewOpp(opp);
    }
  });
  
  //Start prospect choice process
  on(prospectButton, "click", () => {
    nextRound();
    //signRound from 0 to 1
    //add players and opponents to front and back 
  })
  
  on(flipButton, "click", () => {
    flipScenes.forEach((scene) => {
      scene.querySelector(".flip-card").classList.toggle('flipped');
    })
    currentProspect = 1 - currentProspect;
    signButton.textContent = `Sign ${G.prospects[G.signRound-1][currentProspect].name}`
  });
  
  on(signButton, 'click', () => {
    
    //sign the player, put opp on schedule
    signPlayer(G.prospects[G.signRound - 1][currentProspect], G.opps[G.signRound - 1][1 - currentProspect]);
    nextRound();
  });
  
  //remove class and return cards
  on(flipScenes[currentProspect], "transitionend", () => {
    if (G.signRound <= 3 && event.propertyName === "opacity") {
      flipScenes[0].classList.remove('signed', 'sched');
      flipScenes[1].classList.remove('signed', 'sched');
      signButton.textContent = `Sign ${G.prospects[G.signRound-1][currentProspect].name}`;
    }
  })
  
  on(closeButton, 'click', () => {
    closeSpringTraining();
    renderSpringTraining();
    $t("spring-training-content").classList.add("hidden");
    $t("gameday").classList.remove("hidden");
    
    //Update nav button
    $t("event-symbol").textContent = "stadium";
    $t("event-nav-label").textContent = "GAME 1";
    
    //Open gameday content
    renderCover();
    $t("gameday").classList.remove("hidden")
    initLineup();
  })
  
  //Set subscribers
  //re-render when signRound changes
  store.on('signRound:changed', () => {
    renderSpringTraining();
  });
  
  //Do card animation on signing
  store.on("lineup:signing", () => {
    const player = G.fullRoster[G.fullRoster.length - 1]; // just-signed player
    addToLineup(player, G.fullRoster.length - 1, G.fullRoster);
    
    // existing card animation
    flipScenes[currentProspect].classList.add('signed');
    flipScenes[1 - currentProspect].classList.add('sched');
  });
  
  store.on("spring:complete", () => {
    //what was i going to do here?
  })
  
}


export function renderSpringTraining(loadGame = false) {
  
  currentProspect = 0;
  
  //Select sections based in signRound
  if (G.season === "spring") {
    switch (G.signRound) {
      case -1:
        titleSec.classList.add("open");
        [rosTitleSec, signInstSec, chooseSec, closeSec].forEach(sect => sect.classList.remove("open"));
        outTr.classList.add("hidden");
        break;
      case 0:
        [titleSec, chooseSec, closeSec].forEach(sect => sect.classList.remove("open"));
        rosTitleSec.classList.add("open");
        signInstSec.classList.add("open");
        outTr.style.height = "60vw";
        outTr.classList.remove("hidden");
        //$a('lineup-card.new').forEach((el) => { el.classList.remove('new') });
        break;
      case 1:
      case 2:
      case 3:
        [titleSec, signInstSec, closeSec, rosTitleSec].forEach(sect => sect.classList.remove("open"));
        chooseSec.classList.add("open");
        outTr.style.height = "25vw";
        outTr.classList.remove("hidden");
        break;
      case 4:
        [titleSec, signInstSec, chooseSec].forEach(sect => sect.classList.remove("open"));
        rosTitleSec.classList.add("open");
        closeSec.classList.add('open');
        outTr.style.height = "60vw";
        outTr.classList.remove("hidden");
        break;
      default:
        break
    }
    
    //reset the title and flip the prospect cards 
    if (G.signRound >= 1 && G.signRound <= 3) {
      chooseSec.querySelector("h3").textContent = `Sign one, face the other. (${G.signRound} of 3)`;
      flipScenes[0].querySelector(".flip-card").classList.remove('flipped');
      flipScenes[1].querySelector(".flip-card").classList.add('flipped');
      
      //Put prospect cards on the flip cards
      for (let i = 0; i <= 1; i++) {
        flipScenes[i].querySelector(".front").replaceChildren(buildCard(G.prospects[G.signRound - 1][i]));
        flipScenes[i].querySelector(".front").dataset.pid = G.prospects[G.signRound - 1][i].id;
        
        flipScenes[i].querySelector(".back").replaceChildren(buildOpp(G.opps[G.signRound - 1][i]));
        flipScenes[i].querySelector(".back").dataset.pid = G.opps[G.signRound - 1][i].id;
      }
      
      //Update button text
      signButton.textContent = `Sign ${G.prospects[G.signRound-1][currentProspect].name}`
    }
  } else {
    springTrainingContent.classList.add("hidden");
    gamedayContent.classList.remove("hidden")
    //TODO: Update the render gameday screen and remove this. 
  }
}

//Function to add new player card to lineup trough
function addToLineup(player, i, fullRoster) {
  
  const ls1 = $n("div", ["lineup-slot"], linScroll);
  const pCard = $n("div", ["lineup-card", "new", "card"], ls1);
  pCard.dataset.pid = player.id;
  pCard.append(buildCard(player));
  pCard.style.setProperty('--i', fullRoster.length - i);
  
  pCard.addEventListener("animationend", () => {
    pCard.classList.remove("new");
  });
}