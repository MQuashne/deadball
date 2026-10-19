import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
import { teams } from '../model/teams.js'
import { gameSetup } from '../control/setup.js'

export function renderStart() {
  const loadGames = $t("load-games");
  const startScreen = $t("start-screen");
  loadGames.replaceChildren();
  loadGames.textContent = "Start a new season or load an existing game"
  const getSaves = JSON.parse(localStorage.getItem("saveGames"));
  
  for (let i = 0; i <= 2; i++) {
    if (!getSaves[i]) {
      const newSeason = $n("div", ["load-slot", "empty"], loadGames);
      newSeason.textContent = "NEW SEASON";
      on(newSeason, "click", () => {
        gameSetup(i);
        startScreen.classList.add("tuck")
      })
    } else {
      
      const thisSave = getSaves[i];
      
      const thisEvent = thisSave.schedule.find(ev => ev.status === "active")
      const loadSlot = $cl("saved-game-template");
      loadSlot.spot.src = `public/assets/spot/${thisSave.myTeam}.svg`;
      loadSlot.title.textContent = `${thisSave.thisTeam.city} ${thisSave.thisTeam.name}`;
      loadSlot.sp.textContent = `${thisSave.seasonPoints} SP`
      loadSlot.saved.textContent = thisSave.saveDate;
      loadSlot.schedule.textContent = thisEvent.title;
      loadGames.append(loadSlot.root);
      on(loadSlot.button, "click", () => {
        getSaves.splice(i, 1);
        localStorage.setItem("saveGames", JSON.stringify(getSaves));
        renderStart();
      })
    }
  }
}