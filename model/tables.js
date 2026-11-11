export const defaultSwingTable = [
  { min: -20, max: 0, outcome: "Critical Hit", code: "critHit" },
  { min: 1, max: 1, outcome: "Oddity", code: "odd" },
  { min: 2, max: 5, outcome: "Critical Hit", code: "critHit" },
  { min: 6, max: 20, outcome: "Hit", code: "hit" },
  { min: 21, max: 30, outcome: "Walk", code: "walk",stat:"BB" },
  { min: 31, max: 35, outcome: "Possible Error", code: "error" },
  { min: 36, max: 49, outcome: "Sacrifice", code: "sac",stat:"SAC" },
  { min: 50, max: 69, outcome: "Fielder's Choice", code: "fc",stat:"FC" },
  { min: 70, max: 98, outcome: "Out", code: "out" },
  { min: 99, max: 99, outcome: "Oddity", code: "odd" },
  { min: 100, max: 120, outcome: "Critical Out", code: "critOut" }
]

export const defaultHitTable = [
  { min: 1, max: 2, def: "", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 3, max: 3, def: "1B", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 4, max: 4, def: "2B", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 5, max: 5, def: "3B", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 6, max: 6, def: "SS", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 7, max: 9, def: "", runAdvance: 1, stat: "1B", outcome: "Single" },
  { min: 10, max: 14, def: "", runAdvance: 2, stat: "1B", outcome: "Single" },
  { min: 15, max: 15, def: "LF", runAdvance: 2, stat: "2B", outcome: "Double" },
  { min: 16, max: 16, def: "CF", runAdvance: 2, stat: "2B", outcome: "Double" },
  { min: 17, max: 17, def: "RF", runAdvance: 2, stat: "2B", outcome: "Double" },
  { min: 18, max: 18, def: "", runAdvance: 3, stat: "2B", outcome: "Double" },
  { min: 19, max: 20, def: "", runAdvance: 3, stat: "HR", outcome: "HOME RUN" }
]

export const defaultCritHitTable = [
  { min: 1, max: 9, def: "", runAdvance: 2, stat: "2B", outcome: "Double" },
  { min: 10, max: 14, def: "", runAdvance: 3, stat: "2B", outcome: "Double" },
  { min: 15, max: 18, def: "", runAdvance: 3, stat: "3B", outcome: "Triple" },
  { min: 19, max: 20, def: "", runAdvance: 3, stat: "HR", outcome: "HOME RUN" }
]

