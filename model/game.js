export const G = {
  difficulty:"Rookie",
  myTeam:"",
  parkedTeam:{},
  season: "spring", //Major phase
  batterRoster: [],
  pitcherRoster: [],
  tier2Deck: [],
  tier3Deck: [],
  league:[],
  opponents:[],
  fullRoster:[],
  wins:0,
  losses:0,
  seasonPoints:0,
  lineup:{ //All made of player objects
    order:[],
    pitcher:{},
    bench:[],
    bullpen:[]
  },
  diceSupply: 12,
  schedule: [{id:"springTraining",type:"roster",title:"Spring Training",description:"Recruit new players",status:"active"},
  {id:"G1", type:"game", title:"TBD",description:"Game 1",home:true, num:0,result:"",status:"future"},
  {id:"G2", type:"game", title:"TBD",description:"Game 2",home:false, num:1,result:"",status:"future"},
  {id:"G3", type:"game", title:"TBD",description:"Game 3",home:true, num:2,result:"",status:"future"},
  {id:"allStar", type:"roster",title:"All-Star Break",description:"Rest up",status:"future"},
  {id:"G4", type:"game", title:"TBD",description:"Game 4",home:false, num:3,result:"",status:"future"},
  {id:"G5", type:"game", title:"TBD",description:"Game 5",home:true, num:4,result:"",status:"future"},
  {id:"G6", type:"game",title:"TBD",description:"Game 6",home:false, num:5,result:"",status:"future"},
  {id:"playoffs",type:"notion", title:"Playoffs?",description:" Playoffs, baby!",status:"future"}],
  gameNum: 1,
  signRound:-1, //minor phase
  prospects:[], //potential player onjects
  opps:[],
  game: { //single game
    home: true,
    mode:"roll",
    process:"hit",
    currentRoll:[],
    currentOutcome:"",
    opponent: {},
    order: [],
    inning: 7,
    half: 2,
    atBat:true,
    inProgress:false,
    outs: 0,
    dice: 0,
    rerolls: 0,
    rerollAllowed: 99,
    mods: 2,
    modAllowed:99,
    score:[0,0],
    currentBatterIndex: 0,
    pitcher: {},
    pitchAdd:"",
    pitchesLeft:0,
    runners: [],
    oppTokensUsed:0,
    must:false,
    batCoachUsed:false,
    scoreboard:
    [
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