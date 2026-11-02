export const players = [
{
  "id": "001",
  "first": "Marcus",
  "last": "Baker",
  "name": "Marcus Baker",
  "number": 1,
  "tier": 1,
  "dice": 2,
  "reroll": 0,
  "modifier": 0,
  "team":"MRB",
  "condition": "roll",
  "outcomes": [
  {
    "type": "max",
    "target": 6,
    "play": "1B"
  },
  {
    "type": "max",
    "target": 4,
    "play": "SAC"
  }]
},
{
  "id": "002",
  "first": "Jimmy",
  "last": "Martinez",
  "name": "Jimmy Martinez",
  "number": 2,
  "tier": 1,
  "dice": 2,
  "reroll": 1,
  "modifier": 0,
  "team":"ELP",
  "condition": "roll",
  "outcomes": [
  {
    "type": "straight",
    "target": 3,
    "play": "1B"
  }]
},
{
  "id": "003",
  "first": "Louie",
  "last": "Cooper",
  "name": "Louie Cooper",
  "number": 3,
  "tier": 1,
  "dice": 1,
  "reroll": 1,
  "modifier": 0,
  "team":"JAX",
  "condition": "roll",
  "outcomes": [
  {
    "type": "even",
    "count": 2,
    "play": "1B"
  }]
},
{
  "id": "004",
  "first": "Joey",
  "last": "Hughes",
  "name": "Joey Hughes",
  "number": 4,
  "tier": 1,
  "dice": 2,
  "reroll": 0,
  "modifier": 0,
  "team":"RRE",
  "condition": "roll",
  "outcomes": [
  {
    "type": "unequal",
    "count": 3,
    "play": "1B"
  }]
},
{
  "id": "005",
  "first": "Rashawn",
  "last": "Carter",
  "name": "Rashawn Carter",
  "number": 5,
  "tier": 1,
  "dice": 1,
  "reroll": 1,
  "modifier": 0,
  "team":"OKC",
  "condition": "roll",
  "outcomes": [
  {
    "type": "sum",
    "target": 8,
    "play": "1B"
  }]
},
{
  "id": "006",
  "first": "Andre",
  "last": "Parker",
  "name": "Andre Parker",
  "number": 6,
  "tier": 1,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team":"ROC",
  "condition": "roll",
  "outcomes": [
    {
  "type": "value",
  "count": 2,
  "target": 6,
  "play": "HR"
},
  {
    "type": "value",
    "count": 1,
    "target": 6,
    "play": "2B"
  }]
},
{
  "id": "007",
  "first": "Timmy",
  "last": "Sanchez",
  "name": "Timmy Sanchez",
  "number": 7,
  "tier": 1,
  "dice": 2,
  "reroll": 0,
  "modifier": 0,
  "team":"ALB",
  "condition": "roll",
  "outcomes": [
  {
    "type": "match",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "match",
    "count": 2,
    "play": "1B"
  }]
},
{
  "id": "008", //TIER 1 SPECIAL 
  "first": "Tommy",
  "last": "Baxter",
  "name": "Tommy Baxter",
  "number": 8,
  "tier": 1,
  "dice": 3,
  "reroll": 0,
  "modifier": 0,
  "team":"SRC",
  "condition": "opt",
  "action": { "type": "opt", "desc": " Remove 3 dice from your dice pool", "play": "SAC" },
  "rollText":"Sacrifice"
},
{
  "id": "009", //TIER 1 SPECIAL
  "first": "Eddie",
  "last": "Campbell",
  "name": "Eddie Campbell",
  "number": 9,
  "tier": 1,
  "dice": 1,
  "reroll": 0,
  "modifier": 1,
  "team":"DRM",
  "condition": "sp-ec",
  "outcomes": [{ "type": "pairs", "count": 2, "play": "HR" }]
  
},
{
  "id": "010",
  "first": "Jose",
  "last": "Adams",
  "name": "Jose Adams",
  "number": 10,
  "tier": 1,
  "dice": 2,
  "reroll": 0,
  "modifier": 0,
  "team":"TOL",
  "condition": "roll",
  "outcomes": [{ "type": "sum", "target": 12, "play": "2B" }]
},
{
  "id": "011", //TIER 1 SPECIAL
  "first": "Curtis",
  "last": "Garcia",
  "name": "Curtis Garcia",
  "number": 11,
  "tier": 1,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team":"TAC",
  "condition": "auto",
  "action": { "type": "auto", "desc": " +1 die per base runner. If 1st empty:", "play": "BB" }
  
},
{
  "id": "012", //TIER 1 SPECIAL
  "first": "Willie",
  "last": "Morris",
  "name": "Willie Morris",
  "number": 12,
  "tier": 1,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team":"STP",
  "condition": "auto",
  "action": { "type": "auto", "desc": `Remove 1 fatigue from the active pitcher`, "play": "SAC" },
  "rollText": "Sacrifice*"
},
{
  "id": "013",//TIER 1 SPECIAL
  "first": "Xavier",
  "last": "Kelly",
  "name": "Xavier Kelly",
  "number": 13,
  "tier": 1,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team":"NOR",
  "condition": "auto", 
  "action": { "type": "auto", "desc": " Remove all dice and tokens from your pool", "play": "1B" },
  "rollText":"Single*"
},
{
  "id": "014",
  "first": "Sammy",
  "last": "Abbott",
  "name": "Sammy Abbott",
  "number": 14,
  "tier": 1,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team":"LOU",
  "condition": "roll",
  "outcomes": [
  {
    "type": "range",
    "target": 5,
    "play": "2B"
  },
  {
    "type": "range",
    "target": 4,
    "play": "1B"
  },
  {
    "type": "range",
    "target": 3,
    "play": "BB"
  }]
},
{
  "id": "015", //TIER 1 SPECIAL
  "first": "Kenny",
  "last": "Williams",
  "name": "Kenny Williams",
  "number": 15,
  "tier": 1,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team":"OMA",
  "condition": "sp-kw",
  "outcomes": [
  {
    "type": "max",
    "target": 4,
    "play": "2B"
  }]
},
{
  "id": "016",
  "first": "Marlon",
  "last": "Perez",
  "name": "Marlon Perez",
  "number": 16,
  "tier": 1,
  "dice": 1,
  "reroll": 1,
  "modifier": 0,
  "team":"REN",
  "condition": "roll",
  "outcomes": [
  {
    "type": "even",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "odd",
    "count": 3,
    "play": "BB"
  }]
},
{
  "id": "019",
  "first": "Freddy",
  "last": "Mitchell",
  "name": "Freddy Mitchell",
  "number": 19,
  "tier": 2,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team": "SEA",
  "condition": "roll",
  "outcomes": [{ "type": "sum", "target": "11", "play": "2B" }, { "type": "sum", "target": "7", "play": "1B" }]
},
{
  "id": "020",
  "first": "Jerome",
  "last": "Russell",
  "name": "Jerome Russell",
  "number": 20,
  "tier": 2,
  "dice": 1,
  "reroll": 1,
  "modifier": 0,
  "team": "SD",
  "condition": "roll",
  "outcomes": [
  {
    "type": "straight",
    "target": 3,
    "play": "2B"
  },
  {
    "type": "straight",
    "target": 2,
    "play": "1B"
  }]
},
{
  "id": "021",
  "first": "Rashid",
  "last": "Walker",
  "name": "Rashid Walker",
  "number": 21,
  "tier": 2,
  "dice": 3,
  "reroll": 1,
  "modifier": 0,
  "team": "COL",
  "condition": "opt",
  "action": { "type": "opt", "desc": " Remove two dice from your pool to: ", "play": "SAC" }
},
{
  "id": "022",
  "first": "Scooter",
  "last": "McKnight",
  "name": "Scooter McKnight",
  "number": 22,
  "tier": 2,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "TEX",
  "condition": "roll",
  "outcomes": [{ "type": "over", "target": 5, "count": 2, "play": "2B" }, { "type": "over", "target": 5, "count": 1, "play": "1B" }]
},
{
  "id": "023",
  "first": "Bobbie",
  "last": "Ingram",
  "name": "Bobbie Ingram",
  "number": 23,
  "tier": 2,
  "dice": 1,
  "reroll": 0,
  "modifier": 1,
  "team": "LAA",
  "condition": "roll",
  "outcomes": [
  {
    "type": "even",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "even",
    "count": 2,
    "play": "1B"
  }]
},
{
  "id": "024",
  "first": "Bobby",
  "last": "Jones",
  "name": "Bobby Jones",
  "number": 24,
  "tier": 2,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "SF",
  "condition": "roll",
  "outcomes": [
  {
    "type": "max",
    "target": 6,
    "play": "2B"
  },
  {
    "type": "max",
    "target": 4,
    "play": "1B"
  },
  {
    "type": "max",
    "target": 3,
    "play": "SAC"
  }]
},
{
  "id": "025",
  "first": "Jamal",
  "last": "Turner",
  "name": "Jamal Turner",
  "number": 25,
  "tier": 2,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "outcomes": [
  {
    "type": "unequal",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "unequal",
    "count": 2,
    "play": "1B"
  }],
  "team": "CLE",
  "condition": "roll"
},
{
  "id": "026",
  "first": "Ricardo",
  "last": "Hernandez",
  "name": "Ricardo Hernandez",
  "number": 26,
  "tier": 2,
  "dice": 2,
  "reroll": 1,
  "modifier": 0,
  "team": "MIN",
  "condition": "roll",
  "outcomes": [
  {
    "type": "match",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "match",
    "count": 2,
    "play": "1B"
  }]
},
{
  "id": "032",
  "first": "Tony",
  "last": "Benson",
  "name": "Tony Benson",
  "number": 32,
  "tier": 3,
  "dice": 2,
  "reroll": 0,
  "modifier": 1,
  "team": "BOS",
  "condition": "roll",
  "outcomes": [
  {
    "type": "match",
    "count": 3,
    "play": "HR"
  },
  {
    "type": "match",
    "count": 2,
    "play": "2B"
  }]
},
{
  "id": "033",
  "first": "Benny",
  "last": "Hayes",
  "name": "Benny Hayes",
  "number": 33,
  "tier": 3,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team": "CIN",
  "condition": "roll",
  "outcomes": [
  {
    "type": "over",
    "count": 3,
    "target": 4,
    "play": "3B"
  },
  {
    "type": "over",
    "count": 2,
    "target": 4,
    "play": "2B"
  },
  {
    "type": "over",
    "count": 1,
    "target": 4,
    "play": "1B"
  }]
},
{
  "id": "034",
  "first": "Randy",
  "last": "Thompson",
  "name": "Randy Thompson",
  "number": 34,
  "tier": 3,
  "dice": 3,
  "reroll": 0,
  "modifier": 1,
  "team": "BAL",
  "condition": "opt",
  "action": { "type": "opt", "desc": " Remove one die from your pool to: ", "play": "SAC" }
},
{
  "id": "035",
  "first": "Johnny",
  "last": "Sullivan",
  "name": "Johnny Sullivan",
  "number": 35,
  "tier": 3,
  "dice": 1,
  "reroll": 0,
  "modifier": 1,
  "team": "NYY",
  "condition": "roll",
    "outcomes": [
  {
    "type": "straight",
    "target": 4,
    "play": "HR"
  },
  {
    "type": "straight",
    "target": 3,
    "play": "2B"
  },
      {
  "type": "straight",
  "target": 2,
  "play": "1B"
}
    ]
},
{
  "id": "036",
  "first": "Marquis",
  "last": "Drake",
  "name": "Marquis Drake",
  "number": 36,
  "tier": 3,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "LAD",
  "condition": "roll",
      "outcomes": [
  {
    "type": "max",
    "target": 3,
    "play": "SAC"
  },
  {
    "type": "max",
    "target": 4,
    "play": "1B"
  },
  {
  "type": "max",
  "target": 5,
  "play": "2B"
},
{
  "type": "max",
  "target": 6,
  "play": "3B"
}
    ]
},
{
  "id": "037",
  "first": "Tyrone",
  "last": "Jenkins",
  "name": "Tyrone Jenkins",
  "number": 37,
  "tier": 3,
  "dice": 0,
  "reroll": 1,
  "modifier": 0,
  "team": "ATH",
  "condition": "roll",
    "outcomes": [
  {
    "type": "even",
    "count": 1,
    "play": "1B"
  },
  {
    "type": "even",
    "count": 2,
    "play": "2B"
  }]
  
},
{
  "id": "038",
  "first": "Cedric",
  "last": "Young",
  "name": "Cedric Young",
  "number": 38,
  "tier": 3,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team": "HOU",
  "condition": "roll",
    "condition": "roll",
    "outcomes": [
  {
    "type": "sum",
    "target": 6,
    "play": "1B"
  },
  {
    "type": "sum",
    "target": 10,
    "play": "2B"
  },
      {
  "type": "sum",
  "target": 16,
  "play": "HR"
}
    ]
  
},
{
  "id": "044",
  "first": "Reggie",
  "last": "Lawson",
  "name": "Reggie Lawson",
  "number": 44,
  "tier": 3,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team": "ATL",
  "condition": "roll",
  "outcomes": [
  {
    "type": "unequal",
    "count": 2,
    "play": "1B"
  },
  {
    "type": "unequal",
    "count": 3,
    "play": "2B"
  },
  {
    "type": "unequal",
    "count": 4,
    "play": "3B"
  },
  {
    "type": "unequal",
    "count": 5,
    "play": "HR"
  }]
},
{
  "id": "045",
  "first": "Hiroshi",
  "last": "Nakamura",
  "name": "Hiroshi Nakamura",
  "number": 45,
  "tier": 2,
  "dice": 0,
  "reroll": 1,
  "modifier": 0,
  "team": "ARI",
  "condition": "roll",
      "outcomes": [
  {
    "type": "range",
    "target": 3,
    "play": "BB"
  },
  {
    "type": "range",
    "target": 4,
    "play": "2B"
  },
      {
  "type": "range",
  "target": 5,
  "play": "HR"
}
    ]
  
},
{
  "id": "048",
  "first": "Coco",
  "last": "Medina",
  "name": "Coco Medina",
  "number": 48,
  "tier": 2,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "CHR",
  "condition": "opt",
  "action":{"type":"opt","desc":" Copy the resources or ability of one bench player"}
},
{
  "id": "049",
  "first": "Jason",
  "last": "Miller",
  "name": "Jason Miller",
  "number": 49,
  "tier": 2,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "NAS",
  "condition": "auto",
  "action":{"type":"auto","desc":"Add d10 or d6 to pool. Out. Free reroll action for all other batters this inning."}
},
{
  "id": "050",
  "first": "Shugo",
  "last": "Tanaka",
  "name": "Shugo Tanaka",
  "number": 50,
  "tier": 3,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "SLC",
  "condition": "opt",
  "action":{"type":"opt","desc":"Copy the resources of any bench player. Copy the ability of any bench player."}
},
{
  "id": "051",
  "first": "Evan",
  "last": "McAllister",
  "name": "Evan McAllister",
  "number": 51,
  "tier": 3,
  "dice": 1,
  "reroll": 0,
  "modifier": 0,
  "team": "PRT",
  "condition": "auto",
  "action":{"type":"auto","desc":"Add d10 or d6 to pool. Out. Free reroll action for all other batters this inning."}
},
{
  "id": "052",
  "first": "Tomas",
  "last": "Rivera",
  "name": "Tomas Rivera",
  "number": 52,
  "tier": 3,
  "dice": 2,
  "reroll": 0,
  "modifier": 0,
  "team": "BRO",
  "condition": "sp-tr"
},
{
  "id": "053",
  "first": "Tommy",
  "last": "Vaselino",
  "name": "Tommy Vaselino",
  "number": 53,
  "tier": 3,
  "dice": 0,
  "reroll": 0,
  "modifier": 0,
  "team": "BUF",
  "condition": "opt",
  "action":{"type":"opt","desc":"Roll d10, see reference card."}
}]