import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js';

// Per-hit-type tuning. Adjust these to taste.


const HIT_TYPES = {
  G: { peakScale: 1.0, lift: 0, duration: 1200 }, // ground ball: flat line
  L: { peakScale: 1.2, lift: 3.4, duration: 800 }, // line drive
  F: { peakScale: 2.0, lift: 14, duration: 2000 }, // fly ball
  P: { peakScale: 2.8, lift: 28, duration: 2800 }, // pop fly
};

const HOME = { left: 49.6, top: 90 }; // percent of #fielders
const SHADOW = { width: 2.4, height: 1, offsetY: 0.8, opacity: 0.9 }; // % of #fielders

export let ballAnim;

// Creates the shadow once, just before the ball so it sits underneath it.
function getShadow(ball) {
  let shadow = document.getElementById('ball-shadow');
  if (!shadow) {
    shadow = document.createElement('div');
    shadow.id = 'ball-shadow';
    Object.assign(shadow.style, {
      position: 'absolute',
      width: `${SHADOW.width}%`,
      height: `${SHADOW.height}%`,
      borderRadius: '50%',
      background: 'rgba(0, 0, 0, 1)',
      filter: 'blur(1px)',
      pointerEvents: 'none',
      left: `${HOME.left}%`,
      top: `${HOME.top + SHADOW.offsetY}%`,
      opacity: SHADOW.opacity,
      transform: 'translate(-50%, -50%)',
    });
    ball.parentElement.insertBefore(shadow, ball);
  }
  return shadow;
}

/**
 * @param {HTMLElement} ball   the #ball element
 * @param {number} x           target left, in % of #fielders
 * @param {number} y           target top, in % of #fielders
 * @param {'G'|'L'|'F'|'P'} type
 * @returns {Animation}
 */
export function animateHit(x, y, type = 'G') {
  const ball = $t("ball");
  const cfg = HIT_TYPES[type] || HIT_TYPES.G;
  const shadow = getShadow(ball);
  const steps = 40;
  const ballFrames = [];
  const shadowFrames = [];
  const ballBound = ball.getBoundingClientRect();
  const fieldersBound = $t("fielders").getBoundingClientRect();
  const START = {left: 100*(ballBound.left -fieldersBound.left + ballBound.width/2)/fieldersBound.width, top: 100*(ballBound.top -fieldersBound.top + ballBound.height/2)/fieldersBound.height};
 console.log(START)

  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const arc = 4 * t * (1 - t); // 0 -> 1 (at midpoint) -> 0
    
    // Ground path (the shadow follows this exactly)
    
    //CHANGE START TO HOME TO REVERT
    const left =  START.left + (x - START.left) * t;
    const groundTop = START.top + (y - START.top) * t;
    
    // Ball: ground path, lifted up the screen and scaled by the arc
    ballFrames.push({
      left: `${left}%`,
      top: `${groundTop - cfg.lift * arc}%`,
      transform: `translate(-50%, -50%) scale(${1 + (cfg.peakScale - 1) * arc})`,
    });
    
    // Shadow: stays on the ground, shrinks and fades as the ball rises
    const height01 = cfg.lift ? arc : 0;
    shadowFrames.push({
      left: `${left}%`,
      top: `${groundTop + SHADOW.offsetY}%`,
      opacity: SHADOW.opacity * (1 - 0.6 * height01),
      transform: `translate(-50%, -50%) scale(${1 - 0.4 * height01})`,
    });
  }
  
  const opts = {
    duration: cfg.duration,
    easing: type === 'G' ? 'ease-out' : 'linear',
    fill: 'forwards', // stay at the landing spot
  };
  
  shadow.animate(shadowFrames, opts);
 ballAnim = ball.animate(ballFrames, opts);
  return ballAnim
}

// Put the ball (and shadow) back at home plate
export function resetBall() {
  const ball = $t("ball");
  const shadow = getShadow(ball);
  [ball, shadow].forEach(el => el.getAnimations().forEach(a => a.cancel()));
  ball.style.left = `${HOME.left}%`;
  ball.style.top = `${HOME.top}%`;
  ball.style.transform = 'translate(-50%, -50%)';
  shadow.style.left = `${HOME.left}%`;
  shadow.style.top = `${HOME.top + SHADOW.offsetY}%`;
  shadow.style.opacity = SHADOW.opacity;
  shadow.style.transform = 'translate(-50%, -50%)';
}

// Usage:
// const ball = document.getElementById('ball');
// animateHit(ball, 30, 40, 'F');
// animateHit(ball, 62, 55, 'G').finished.then(() => console.log('landed'));

export const positions = {
  "P": { x: 50, y: 62.588 },
  "C": { x: 0.5, y: 0.96176 },
  "1B": { x: 80.59, y: 55.44 },
  "2B": { x: 70, y: 35},
  "3B": { x: 19.41, y: 55.44 },
  "SS": { x: 30, y: 35 },
  7: { x: 0.1, y: 0.2 },
  8: { x: 0.5, y: 0.1 },
  9: { x: 0.9, y: 0.2 },
  home: { x: 0.5, y: 0.90824 }
}

export const hitLocations = {
  h8D: { ang: "0deg", dist: "87%" },
  h8: { ang: "0deg", dist: "75%" },
  h1: { ang: "0deg", dist: "30%" },
  h1S: { ang: "0deg", dist: "18%" },
  h2: { ang: "0deg", dist: "8%" },
  h78D: { ang: "-15deg", dist: "90%" },
  h78: { ang: "-15deg", dist: "80%" },
  h6: { ang: "-20deg", dist: "50%" },
  h6s: { ang: "-20deg", dist: "38%" },
  h15: { ang: "-20deg", dist: "30%" },
  h7D: { ang: "-29deg", dist: "92%" },
  h7: { ang: "-29deg", dist: "73%" },
  h56: { ang: "-28deg", dist: "55%" },
  h56S:{ ang: "-28deg", dist: "38%" },
  h25: { ang: "-30deg", dist: "18%" },
  h7LD: { ang: "-42deg", dist: "90%" },
  h7L: { ang: "-42deg", dist: "73%" },
  h5: { ang: "-35deg", dist: "55%" },
  h5S: { ang: "-40deg", dist: "35%" },
  h89D: { ang: "15deg", dist: "90%" },
  h89: { ang: "15deg", dist: "80%" },
  h4: { ang: "20deg", dist: "50%" },
  h4S: { ang: "20deg", dist: "38%" },
  h13: { ang: "20deg", dist: "30%" },
  h9D: { ang: "29deg", dist: "92%" },
  h9: { ang: "29deg", dist: "73%" },
  h34: { ang: "28deg", dist: "55%" },
  h34S: { ang: "28deg", dist: "38%" },
  h23: { ang: "30deg", dist: "18%" },
  h9LD: { ang: "42deg", dist: "90%" },
  h9L: { ang: "42deg", dist: "73%" },
  h3: { ang: "35deg", dist: "55%" },
  h3S: { ang: "40deg", dist: "35%" },
  h6M: { ang: "-7deg", dist: "60%" },
  h6MS: { ang: "-7deg", dist: "42%" },
  h4M: { ang: "7deg", dist: "60%" },
  h4MS: { ang: "7deg", dist: "42%" },
};
/*
h: { x: 0.5, y: 0.975 },
  f: { x: 0.9, y: 0.575 },
  s: { x: 0.5, y: 0.175 },
  t: { x: 0.1, y: 0.575 }

h:.5,.902
1b: .766,.636

.5,.37
.234,.636

/*
loc - P {
    top: 64.9 % ;
    left: 49.6 % ;
  }
  
  .loc - C {
    top: 94 % ;
    left: 49.6 % ;
  }
  
  .loc - 1 B {
    top: 57 % ;
    left: 76 % ;
    transition: all 0.5 s;
  }

#field - 2 B {
  top: 41 % ;
  left: 64 % ;
}

#field - SS {
  top: 41 % ;
  left: 36 % ;
}

#field - 3 B {
  top: 55 % ;
  left: 24 % ;
}

#field - LF {
  top: 25 % ;
  left: 10 % ;
}

#field - RF {
  top: 25 % ;
  left: 90 % ;
}

#field - CF {
  top: 10 % ;
  left: 49.6 % ;
}



catcher 0.5,0.85 -> 0.496,0.94;
pitcher 0.5,0.625 -> 0.496,0.649
2b 0.5,0.175 -> 0.496,0.38
1b 3: { x: 0.85, y: 0.475 },
x:0.76, y:.57

y:
slope .8296
add .2348

x: 

*/