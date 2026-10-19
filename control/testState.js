  import { G } from '../model/game.js'
  
  export function setTest() {
    
    
    
    //TESTING ONLY
   /* G.season = "season";
    const signings = G.tier2Deck.splice(0, 3);
    signings.forEach((fng) => {
      if (fng.fatigue) {
        G.lineup.bullpen.push(fng);
      } else {
        G.lineup.bench.push(fng);
      }
    });
    
    const oppSignings = G.tier2Deck.splice(0, 3);
    
    //G.opponents.push(G.league.find(t => t.code ==="ARI"));
    for (let i = 0; i < 3; i++) {
     const opp = G.league.find(t => t.id === oppSignings[i].id);
      G.opponents.push(opp);
      
      const nextGame = G.schedule.find(event => event.id === `G${i+1}`);
      nextGame.title = `${opp.city} ${opp.team}`;
      if (i === 0) {
        nextGame.status = "active";
      }
    }
    G.schedule.find(event => event.id === `springTraining`).status = "past";
    */
  }