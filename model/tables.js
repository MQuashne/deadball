export const hitFromValue = {
  "1": "1B",
  "2": "2B",
  "3": "3B",
  "4": "HR"
}

export const valueFromHit = {
  "1B":1,
  "2B":2,
  "3B":3,
  "HR":4
}

export const hits = {
  "1B": {
    batterBases: 1,
    runnerBases: 1,
    text: "Single",
    stat: "1B"
  },
    "2B": {
    batterBases: 2,
    runnerBases: 2,
    text: "Double",
    stat: "2B"
  },
    "3B": {
    batterBases: 3,
    runnerBases: 3,
    text: "Triple",
    stat: "3B"
  },
    "HR": {
    batterBases: 4,
    runnerBases: 4,
    text: "Home Run",
    stat: "HR"
  }
}

export const positions = {
  "P":1,
  "C":2,
  "1B":3,
  "2B":4,
  "3B":5,
  "SS":6,
  "LF":7,
  "CF":8,
  "RF":9
}


export const defaultSwingTable = [
  { min: -20, max: 0, outcome: "Critical Hit", code: "critHit" },
  { min: 1, max: 1, outcome: "Oddity", code: "odd" },
  { min: 2, max: 5, outcome: "Critical Hit", code: "critHit" },
  { min: 6, max: 20, outcome: "Hit", code: "hit" },
  { min: 21, max: 30, outcome: "Walk", code: "walk", stat: "BB" },
  { min: 31, max: 35, outcome: "Possible Error", code: "error" },
  { min: 36, max: 49, outcome: "Sacrifice", code: "sac", stat: "SAC" },
  { min: 50, max: 69, outcome: "Fielder's Choice", code: "fc", stat: "FC" },
  { min: 70, max: 98, outcome: "Out", code: "out" },
  { min: 99, max: 99, outcome: "Oddity", code: "odd" },
  { min: 100, max: 120, outcome: "Critical Out", code: "critOut" }
]

export const defaultHitTable = [
  { min: 1, max: 2, def: "", runAdvance: 1, stat: "1B", outcome: "Single", code:"endAB" },
  { min: 3, max: 3, def: "1B", runAdvance: 1, stat: "1B", outcome: "Single", code:"def" },
  { min: 4, max: 4, def: "2B", runAdvance: 1, stat: "1B", outcome: "Single", code:"def"  },
  { min: 5, max: 5, def: "3B", runAdvance: 1, stat: "1B", outcome: "Single", code:"def"  },
  { min: 6, max: 6, def: "SS", runAdvance: 1, stat: "1B", outcome: "Single", code:"def"  },
  { min: 7, max: 9, def: "", runAdvance: 1, stat: "1B", outcome: "Single", code:"endAB" },
  { min: 10, max: 14, def: "", runAdvance: 2, stat: "1B", outcome: "Single", code:"endAB" },
  { min: 15, max: 15, def: "LF", runAdvance: 2, stat: "2B", outcome: "Double", code:"def"  },
  { min: 16, max: 16, def: "CF", runAdvance: 2, stat: "2B", outcome: "Double", code:"def"  },
  { min: 17, max: 17, def: "RF", runAdvance: 2, stat: "2B", outcome: "Double", code:"def"  },
  { min: 18, max: 18, def: "", runAdvance: 3, stat: "2B", outcome: "Double", code:"endAB" },
  { min: 19, max: 20, def: "", runAdvance: 3, stat: "HR", outcome: "HOME RUN", code:"endAB" }
]

export const defaultCritHitTable = [
  { min: 1, max: 14, def: "", runAdvance: 3, stat: "2B", outcome: "Double", code:"endAB" },
  { min: 15, max: 18, def: "", runAdvance: 4, stat: "3B", outcome: "Triple", code:"endAB" },
  { min: 19, max: 20, def: "", runAdvance: 3, stat: "HR", outcome: "HOME RUN", code:"endAB" }
]

export const defaultDefenseTable = [
  { min: 1, max: 2, hitChange: 0, out: false, play: "E", outcome:"Error (Runners+1)", code:"endAB" },
  { min: 3, max: 9, hitChange: 0, runChange: 0, out: false, play: "", code:"endAB" },
  { min: 10, max: 11, hitChange: -1, runChange: -1, out: false, play: "", code:"endAB" },
  { min: 12, max: 12, hitChange: 0, runChange: 0, out: true, play: "PO", code:"endAB", outcome:"Out",stat: "out" }
]