export const G = {
  myTeam: "",
  opponents: [],
  wins: 0,
  losses: 0,
  lineup: { //All made of player objects
    order: [],
    pitcher: {},
    rotation: [],
    bench: [],
    bullpen: [],
    batterReserve: [],
  },
  schedule: [{ id: "G1", type: "game", title: "TBD", description: "Game 1", home: true, num: 0, result: "", status: "future" },
    { id: "G2", type: "game", title: "TBD", description: "Game 2", home: false, num: 1, result: "", status: "future" },
    { id: "G3", type: "game", title: "TBD", description: "Game 3", home: true, num: 2, result: "", status: "future" },
    { id: "allStar", type: "roster", title: "All-Star Break", description: "Rest up", status: "future" },
    { id: "G4", type: "game", title: "TBD", description: "Game 4", home: false, num: 3, result: "", status: "future" },
    { id: "G5", type: "game", title: "TBD", description: "Game 5", home: true, num: 4, result: "", status: "future" },
    { id: "G6", type: "game", title: "TBD", description: "Game 6", home: false, num: 5, result: "", status: "future" },
    { id: "playoffs", type: "notion", title: "Playoffs?", description: " Playoffs, baby!", status: "future" }
  ],
  currentEventIndex:0,
  game: { //single game
    home: true,
    process: "swing",
    roll: [],
    outcome: "",
    inning: 1,
    half: 1,
    atBat: false,
    inProgress: false,
    outs: 0,
    score: [0, 0],
    opponent: {}, 
    currentBatterIndex: 0,
    currentRotationIndex: 0,
    runners: [],
    scoreboard: [
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ]
    ]
  }
}


/*------------
Single game state (current, do historic later)
home/away
opponent
lineup
bench
pitcher
fatigue

inning
half
outs
dice
rerolls
modifiers
runners
1st
2nd
3rd
batter index
-------------*/

/*------------
Team object (current, stats elsewhere)
roster (batters/pitchers)
schedule
game index
season points
record
------------*/