import { teamUnis, teamNames, leagueNames, evergreenJerseys } from '../dice/assets/teamColors.js'
import { DICE } from '../dice/dice.js'
import { G } from '../model/game.js'
import { renderSpringTraining } from '../render/renderSpringTraining.js'
import { renderCover } from '../render/renderGameday.js'
import { allPlayers } from '../control/setup.js'
import { buildCard } from '../render/buildCard.js'
import { $n, $t, $c, $a, $cl, on, randInt, findKey } from '../util.js'
import { opponents } from '../model/opponents.js'
import { teams, leagues } from '../model/teams.js'

const _option = (val, text) => {
  const o = document.createElement('option');
  o.value = val;
  o.textContent = text;
  return o
};

const leagueSelect = $t("league-select")
const teamSelect = $t("team-select");
const uniSelect = $t("uni-select");
const uniSelectGD = $t("uni-select-gameday");
const uniSelects = [uniSelect, uniSelectGD];


export function colorSetup(box) {
  const replacements = adjustTeams();
  
  leagues.forEach((league) => {
    const leagueOpt = _option(league.code, league.name);
    leagueSelect.appendChild(leagueOpt);
  });
  
  //Initial Values
  leagueSelect.value = G.thisTeam.league;
  popTeamPicker(G.thisTeam.league, box);
  teamSelect.value = G.thisTeam.code
  popUniPicker(G.thisTeam.code, box);
  uniSelect.value = "Home";
  
  on(leagueSelect, 'change', (e) => {
    let league = e.target.value;
    popTeamPicker(league, box);
    popUniPicker(teams.filter(t => t.league === league)[0].code, box)
  });
  on(teamSelect, 'change', (e) => {
    let team = e.target.value;
    document.documentElement.dataset.team = team;
    
    G.fullRoster.forEach((player) => player.team = team);
    G.myTeam = team;
    G.thisTeam = teams.find((t) => t.code === team);
    $t('header-team-name').textContent = `${G.thisTeam.city} ${G.thisTeam.name}`;
    const onBoard = document.querySelectorAll(".card");
    onBoard.forEach((card) => {
      if (card.dataset.pid) {
        card.innerHTML = '';
        card.append(buildCard(allPlayers.find(player => player.id === card.dataset.pid)))
      }
    })
    popUniPicker(team, box);
    if (G.season === "season" || G.season === "playoffs") {
      renderCover();
    }
  });
  
  uniSelects.forEach(us => {
    on(us, 'input', (e) => {
      let uni = evergreenJerseys[leagueSelect.value][teamSelect.value][e.target.value];
      let team = teamSelect.value;
      
      uniSelects.forEach(selector => {
        selector.selectedIndex = e.target.selectedIndex
      })
      setColors(uni, box, team);
      
    })
  })
  
}

function popTeamPicker(league, box) {
  teamSelect.innerHTML = "";
  
  const leagueTeams = teams.filter(t => t.league === league);
  leagueTeams.forEach(team => {
    const teamOpt = _option(team.code, `${team.city} ${team.name}`);
    teamSelect.appendChild(teamOpt);
    teamSelect.selectedIndex = 0;
  });
}

function popUniPicker(team, box) {
  uniSelects.forEach(us => {
    us.innerHTML = "";
    const league = leagueSelect.value;
    const unis = evergreenJerseys[league][team];
    Object.entries(unis).forEach(([uni, value]) => {
      const uniOpt = _option(uni, uni);
      us.appendChild(uniOpt);
      setColors(unis["Home"], box);
      us.selectedIndex = 0;
    });
  })
  
}

function showUniPalette() {
  $t("uniform-palette").replaceChildren();
  const league = leagueSelect.value;
  const team = teamSelect.value;
  const unis = evergreenJerseys[league][team];
  Object.entries(unis).forEach(([uni, data]) => {
    
    const die = document.createElement('div');
    die.className = 'palette-die-box';
    const dieShow = document.createElement('div');
    dieShow.className = 'die-show';
    const dieLabel = document.createElement('div');
    dieLabel.className = 'die-label';
    dieLabel.textContent = uni;
    
    
    if (data.stripe) {
      die.style.background = `linear-gradient(90deg,${data.jersey} 0%, ${data.jersey} 5%, ${data.stripe}a0 6%, ${data.jersey} 7%, ${data.jersey} 35%, ${data.stripe}a0 36%, ${data.jersey} 37%, ${data.jersey} 65%, ${data.stripe}a0 66%, ${data.jersey} 67%, ${data.jersey} 95%, ${data.stripe}a0 96%, ${data.jersey} 97%, ${data.jersey} 100%)`;
    } else {
      die.style.background = data.jersey;
    }
    die.style.color = data.text;
    die.style.webkitTextStroke = `2px ${data.outline}`;
    die.style.paintOrder = "stroke fill"
    die.textContent = "8"
    dieShow.appendChild(die);
    dieShow.appendChild(dieLabel);
    $t("uniform-palette").appendChild(dieShow);
  });
}

function setColors(uni, box) {
  const empty = "";
  showUniPalette();
  if (uni.stripe === "" || uni.stripe === uni.jersey) {
    document.documentElement.style.setProperty('--die-bg-color', uni.jersey);
  } else {
    document.documentElement.style.setProperty('--die-bg-color', `linear-gradient(90deg,${uni.jersey} 0%, ${uni.jersey} 5%, ${uni.stripe}a0 6%, ${uni.jersey} 7%, ${uni.jersey} 35%, ${uni.stripe}a0 36%, ${uni.jersey} 37%, ${uni.jersey} 65%, ${uni.stripe}a0 66%, ${uni.jersey} 67%, ${uni.jersey} 95%, ${uni.stripe}a0 96%, ${uni.jersey} 97%, ${uni.jersey} 100%)`)
  }
  
  
  document.documentElement.style.setProperty('--die-font-color', uni.text);
  document.documentElement.style.setProperty('--die-outline-color', uni.outline ||= "#ffffff00");
  document.documentElement.style.setProperty('--td', G.thisTeam.td === "#000000" ? "#222222" : G.thisTeam.td);
  document.documentElement.style.setProperty('--tl', G.thisTeam.tl);
  document.documentElement.style.setProperty('--tl-text', G.thisTeam.tlText);
  
  
  $t("game-header-logo").src = `public/assets/logos/${G.thisTeam.tpLogo}.svg`;
  $t("hero-spot").src = `public/assets/spot/${G.thisTeam.code}.svg`;
  
  
  
  //console.log($t("game-header-logo").getBBox());
  
  G.thisTeam.uni = uniSelect.value;
  DICE.set_color('dice', uni.jersey);
  DICE.set_color('label', uni.text);
  DICE.set_color('stripe', uni.stripe ||= uni.jersey);
  DICE.set_color('outline', uni.outline ||= uni.jersey);
  box.start_throw((notation) => [1, 2, 3, 4, 5, 6]);
}


function adjustTeams() {
  //look for selected team in opponents list 
  G.league = [...opponents];
  const selTeam = G.league.find(t => t.code === G.thisTeam.code)
  
  //Only do something if there is already a parked team or the selected team is in the opponents list 
  
  if (selTeam) {
    G.parked = { ...selTeam };
    const excludeT = new Set(G.league.map(t => t.code));
    const remTeams = teams.filter(opt => !excludeT.has(opt.code));
    const filler = remTeams[randInt(0, remTeams.length - 1)];
    
    const pl = allPlayers.find(p => p.team === selTeam.code)
    selTeam.code = filler.code;
    selTeam.team = filler.name;
    selTeam.city = filler.city;
    pl.team = filler.code
  }
  
}