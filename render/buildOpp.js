import { $n, $t, $c, $a, on, randInt } from '../util.js'
import { teams } from '../model/teams.js'

function $sao(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'style' && typeof value === 'object') {
      // Assign properties directly to the element's style object
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
}
const $sa = (svg, att, val) => svg.setAttribute(att, val);
const $ne = (el) => {
  const newEl = document.createElementNS('http://www.w3.org/2000/svg', el);
  return newEl
}

function randBt(min, max) {
  return Math.random() * (max - min) + min;
}

let oppCardInstance=0
export function buildOpp(team) {
 
 const pTeam = teams.find((t) => t.code===team.code);
 
  const uid=`${team.id}-${++oppCardInstance}`

  /*---------
  BUILD THE FULL CARD SVG FROM PLAYER DATA
  ----------*/
  
 function getContrastColor(hexColor) {
  // 1. Remove the # character if present
  const cleanHex = hexColor.replace(/^#/, '');
  
  // 2. Parse hex values into integer R, G, B channels
  const r8 = parseInt(cleanHex.substring(0, 2), 16);
  const g8 = parseInt(cleanHex.substring(2, 4), 16);
  const b8 = parseInt(cleanHex.substring(4, 6), 16);
  
  // 3. Convert 8-bit channels to sRGB decimals
  const rgbDecimals = [r8, g8, b8].map(val => val / 255);
  
  // 4. Apply the sRGB linearization (gamma expansion) formula
  const [r, g, b] = rgbDecimals.map(s => {
    return s <= 0.03928 ?
      s / 12.92 :
      Math.pow((s + 0.055) / 1.055, 2.4);
  });
  
  // 5. Calculate relative luminance using standard WCAG weights
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  // 6. Return black or white based on the CSS specification cutoff
  return luminance > 0.1791 ? '#000000' : '#ffffff';
}


const tp = pTeam.tp;
const ts = pTeam.ts;

const tpText = getContrastColor(tp);
const tsText = getContrastColor(ts);

//Create SVG Shell  
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
svg.id = team.code;

const svgSt = {
  width: "100%",
  height: "100%",
  viewBox: "0 0 250 350"
}
$sao(svg, svgSt)
//CREATE DEFS
const defs = $ne('defs');

// --------------------------------------------------------------------------
// CREATE GRADIENT
// --------------------------------------------------------------------------

//FoilGradient
const linGrad = $ne('linearGradient');
linGrad.id = `foil-gradient${uid}`;
$sao(linGrad, {
  x1: "100%",
  x2: "0",
  y1: 0,
  y2: "100%"
});

//GRADIENT STOPS
const stopData = [
  { p: 0, c: "#ffc0c0", o: randBt(0.2, 0.8) },
  { p: 0.08, c: "#ffe0c0", o: randBt(0.2, 0.8) },
  { p: 0.16, c: "#fff0c0", o: randBt(0.2, 0.8) },
  { p: 0.25, c: "#c0ffc0", o: randBt(0.2, 0.8) },
  { p: 0.33, c: "#c0c0ff", o: randBt(0.2, 0.8) },
  { p: 0.41, c: "#ffc0ff", o: randBt(0.2, 0.8) },
  { p: 0.5, c: "#ffc0c0", o: randBt(0.2, 0.8) },
  { p: 0.58, c: "#ffe0c0", o: randBt(0.2, 0.8) },
  { p: 0.66, c: "#fff0c0", o: randBt(0.2, 0.8) },
  { p: 0.75, c: "#c0ffc0", o: randBt(0.2, 0.8) },
  { p: 0.83, c: "#c0c0ff", o: randBt(0.2, 0.8) },
  { p: 0.91, c: "#ffc0ff", o: randBt(0.2, 0.8) },
  { p: 1, c: "#ffc0c0", o: randBt(0.2, 0.8) }
];
stopData.forEach((stop) => {
  const st = $ne("stop");
  $sao(st, {
    offset: stop.p,
    "stop-color": stop.c,
    "stop-opacity": stop.o
  });
  
  linGrad.append(st);
});
defs.append(linGrad);

//Metalic Black Gradient
const tierGrad = $ne('linearGradient');
tierGrad.id = `tier-gradient${uid}`;
$sa(tierGrad, 'x1','0%');
$sa(tierGrad, 'x2','100%');
$sa(tierGrad, 'y1', "0");
$sa(tierGrad, 'y2', "100%");

//GRADIENT STOPS
const slvStop = [
  { p: 0, c: "#b1b2b4", o: 0.5 },
  { p: 0.25 + randBt(-.1, .1), c: "#7A7B7F", o: 0.5 },
  { p: 0.5 + randBt(-.1, .1), c: "#F0F0F0", o: 0.5 },
  { p: 0.75 + randBt(-.1, .1), c: "#A7A8AC", o: 0.5 },
  { p: 1, c: "#EDEDED", o: 1 }
];


//PICK IT UP HERE
slvStop.forEach((stop) => {
  const st = $ne("stop");
  $sao(st, {
    offset: stop.p,
    "stop-color": stop.c,
    "stop-opacity": stop.o
  });
  tierGrad.append(st);
});
defs.append(tierGrad);

// --------------------------------------------------------------------------
// CLIP BACKGROUND
// --------------------------------------------------------------------------
const clipCard = $ne('clipPath');
clipCard.id = `cardClip${uid}`;
const cdRect = $ne('rect');
$sao(cdRect, {
  x: 0,
  y: 0,
  width: 250,
  height: 350
})

clipCard.append(cdRect);
defs.append(clipCard);
svg.append(defs);

// --------------------------------------------------------------------------
// ADD PLAYER IMAGE
// --------------------------------------------------------------------------
//SILVER BG
const tBg = $ne('rect');
$sao(tBg,{
  height:350,
  width:250,
  x:0,
  y:0,
  fill: `url(#${`tier-gradient${uid})`}`
});
svg.append(tBg);

//TEAM LOGO  
const tLogo = $ne('image');
tLogo.id = `team-logo-${team.code}`;
$sao(tLogo, {
  x: 62.5,
  y: 83,
  width: 125,
  height: 125,
  href: `public/assets/logos/${team.code}.svg`
})
svg.append(tLogo);

// --------------------------------------------------------------------------
// ADD CARD TEMPLATE ELEMENTS
// --------------------------------------------------------------------------
const template = $ne('g');
$sa(template, 'clip-path', `url(#cardClip${uid})`);


//Left bar primary
const leftBar = $ne('rect');
$sao(leftBar, {
  x: 0,
  y: 0,
  width: 20,
  height: 350,
  fill: tp
});

template.append(leftBar);

//Right bar primary
const rightBar = $ne('rect');
$sao(rightBar, {
  x: 230,
  y: 0,
  width: 20,
  height: 350,
  fill: tp
});
template.append(rightBar);

//Top bar secondary
const topBarS = $ne('path');
$sao(topBarS, {
  d: 'M 0 0 v 55 h 210 l 55 -55 z',
  fill: ts
});
template.append(topBarS);

//Top bar primary
const topBarP = $ne('path');
$sao(topBarP, {
  d: 'M 0 0 v 62 h 190 l 62 -62 z',
  fill: tp
});

template.append(topBarP);
svg.append(template)

//Bottom bar primary
const botBarP = $ne('path');
$sao(botBarP, {
  d: 'M 0 250 v 100 h 250 v -37 l -63 -63 z',
  fill: tp
});
template.append(botBarP);

//Resource bar secondary
const resBarS = $ne('path');
$sa(resBarS, 'd', 'M 0 230 v 30 h 180 l -30 -30 z');
$sa(resBarS, 'fill', ts);
template.append(resBarS);


// --------------------------------------------------------------------------
// ADD CARD TEXT ELEMENTS
// --------------------------------------------------------------------------

const teamName = $ne('text');
$sao(teamName, {
  style: {
    fontFamily: `"Proxima Nova","Arial"`,
    textAlign: "left",
    textAnchor: "left",
    fill: tpText
  },
  x: 15,
  y: 24
})

const cityName = $ne('tspan');
cityName.textContent = `${team.city} `;
$sa(cityName,'font-size','1.3em')
teamName.append(cityName);

const clubName = $ne('tspan');
clubName.textContent = `${team.team} `;
$sa(clubName, 'font-size', '1.6em');
$sa(clubName, 'font-weight', '700');
$sa(clubName, 'dy', '1em');
$sa(clubName, 'x', '15')
teamName.append(clubName);
svg.append(teamName);

const dText = $ne('text');
$sao(dText,{
  x:10,
  y:253,
  style:{
    fontFamily: "'Proxima Nova', 'Arial'",
    fontWeight:700,
    fontSize:20,
    fill:tsText
  }
});
dText.textContent=team.roll;
svg.append(dText);

const fObj = $ne('foreignObject');
$sao(fObj, {
  x: 10,
  y: 265,
  width: 190,
  height: 61
})

const fFlex = $n('div');
fFlex.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/1999/xhtml");
$sao(fFlex, {
  style: {
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    gap: `$1px`,
    width: "100%",
    height: "100%",
    flexDirection: "column"
  }
})
fObj.append(fFlex);

const fTex = $n('div');
fTex.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/1999/xhtml");
$sao(fTex, {
  style: {
    boxSizing: "border-box",
    display: "flex",
    gap: "10px",
    width: "100%",
    minHeight: 0,
    justifyContent: "center",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    color: "white",
    fontFamily: "Arial",
    fontSize: "0.95em",
    textAlign: "left",
    lineHeight:1
  }
});
fTex.textContent = team.action;
fFlex.append(fTex);
svg.append(fObj);
return svg
}