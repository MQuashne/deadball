import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js';

// Per-hit-type tuning. Adjust these to taste.


const HIT_TYPES = {
	G: { peakScale: 1.0, lift: 0, duration: 1200, caption: "ground ball" }, // ground ball: flat line
	L: { peakScale: 1.2, lift: 3.4, duration: 800, caption: "line drive" }, // line drive
	F: { peakScale: 2.0, lift: 14, duration: 2000, caption: "fly ball" }, // fly ball
	P: { peakScale: 2.8, lift: 28, duration: 2800, caption: "pop fly" }, // pop fly
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
	const START = { left: 100 * (ballBound.left - fieldersBound.left + ballBound.width / 2) / fieldersBound.width, top: 100 * (ballBound.top - fieldersBound.top + ballBound.height / 2) / fieldersBound.height };
	console.log(START)
	
	
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const arc = 4 * t * (1 - t); // 0 -> 1 (at midpoint) -> 0
		
		// Ground path (the shadow follows this exactly)
		
		//CHANGE START TO HOME TO REVERT
		const left = START.left + (x - START.left) * t;
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
	"C": { x: 50, y: 96.176 },
	"1B": { x: 80.59, y: 55.44 },
	"2B": { x: 70, y: 35 },
	"3B": { x: 19.41, y: 55.44 },
	"SS": { x: 30, y: 35 },
	"LF": { x: 10, y: 20 },
	"CF": { x: 50, y: 10 },
	"RF": { x: 90, y: 20 },
	home: { x: 50, y: 90.824 }
}

export const hitLocations = {
	"8D": { x: 50, y: 3.82, caption: "to deep center" },
	"8": { x: 50, y: 15.82, caption: "to center" },
	"1": { x: 50, y: 60.82, caption: "back to the mound" },
	"1S": { x: 50, y: 72.82, caption: "short of the mound " },
	"2": { x: 50, y: 82.82, caption: "in front of the mound" },
	"78D": { x: 26.71, y: 3.89, caption: "to deep left center" },
	"78": { x: 29.29, y: 13.55, caption: "in the left outfield gap" },
	"6": { x: 32.9, y: 43.84, caption: "to the shortstop" },
	"6S": { x: 37, y: 55.12, caption: "short of the shortstop" },
	"15": { x: 39.74, y: 62.63, caption: "between the mound and third" },
	"7D": { x: 5.4, y: 10.36, caption: "to deep left" },
	"7": { x: 14.61, y: 26.98, caption: "to left" },
	"56": { x: 24.18, y: 42.26, caption: "in the left infield gap" },
	"56S": { x: 32.16, y: 57.27, caption: "short on the left" },
	"25": { x: 41, y: 75.24, caption: "short of the second baseman" },
	"7LD": { x: -10.22, y: 23.94, caption: "in the left cotner" },
	"7L": { x: 1.15, y: 36.57, caption: "along the left foul line" },
	"5": { x: 18.45, y: 45.77, caption: "to third base" },
	"5S": { x: 27.5, y: 64.01, caption: "short of third base" },
	"89D": { x: 73.29, y: 3.89, caption: "to deep right center" },
	"89": { x: 70.71, y: 13.55, caption: "to left center" },
	"4": { x: 67.1, y: 43.84, caption: "to the second baseman" },
	"4S": { x: 63, y: 55.12, caption: "short of the second baseman" },
	"13": { x: 60.26, y: 62.63, caption: "between the mound and first" },
	"9D": { x: 94.6, y: 10.36, caption: "to deep right" },
	"9": { x: 85.39, y: 26.98, caption: "to right" },
	"34": { x: 75.82, y: 42.26, caption: "to the right infield gap" },
	"34S": { x: 67.84, y: 57.27, caption: "on the right infield" },
	"23": { x: 59, y: 75.24, caption: "along the first base line" },
	"9LD": { x: 110.22, y: 23.94, caption: "in the right corner " },
	"9L": { x: 98.85, y: 36.57, caption: "along the right foul line" },
	"3": { x: 81.55, y: 45.77, caption: "to first" },
	"3S": { x: 72.5, y: 64.01, caption: "short of third" },
	"6M": { x: 42.69, y: 31.27, caption: "left of second" },
	"6MS": { x: 44.88, y: 49.14, caption: "left middle infield" },
	"4M": { x: 57.31, y: 31.27, caption: "right of second" },
	"4MS": { x: 55.12, y: 49.14, caption: "right middle infield" }
}

const singleHits = {
	"1B": [
	{
		"hitType": "G",
		"hitLoc": "34",
		"p": 0.45
	},
	{
		"hitType": "G",
		"hitLoc": "3",
		"p": 0.83
	},
	{
		"hitType": "G",
		"hitLoc": "34S",
		"p": 0.94
	},
	{
		"hitType": "L",
		"hitLoc": "3",
		"p": 0.97
	},
	{
		"hitType": "G",
		"hitLoc": "3S",
		"p": 1
	}],
	"2B": [
	{
		"hitType": "G",
		"hitLoc": "4",
		"p": 0.4
	},
	{
		"hitType": "G",
		"hitLoc": "34",
		"p": 0.73
	},
	{
		"hitType": "G",
		"hitLoc": "4M",
		"p": 0.94
	},
	{
		"hitType": "G",
		"hitLoc": "4MS",
		"p": 0.97
	},
	{
		"hitType": "G",
		"hitLoc": "4S",
		"p": 1
	}],
	"3B": [
	{
		"hitType": "G",
		"hitLoc": "5",
		"p": 0.28
	},
	{
		"hitType": "G",
		"hitLoc": "56",
		"p": 0.54
	},
	{
		"hitType": "G",
		"hitLoc": "56S",
		"p": 0.76
	},
	{
		"hitType": "G",
		"hitLoc": "5S",
		"p": 0.91
	},
	{
		"hitType": "G",
		"hitLoc": "25",
		"p": 1
	}],
	"SS": [
	{
		"hitType": "G",
		"hitLoc": "6",
		"p": 0.48
	},
	{
		"hitType": "G",
		"hitLoc": "56",
		"p": 0.76
	},
	{
		"hitType": "G",
		"hitLoc": "6M",
		"p": 0.92
	},
	{
		"hitType": "G",
		"hitLoc": "6S",
		"p": 1
	}],
	"LF": [
	{
		"hitType": "L",
		"hitLoc": "7",
		"p": 0.28
	},
	{
		"hitType": "L",
		"hitLoc": "78",
		"p": 0.54
	},
	{
		"hitType": "L",
		"hitLoc": "7S",
		"p": 0.68
	},
	{
		"hitType": "L",
		"hitLoc": "7L",
		"p": 0.8
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.89
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 0.98
	},
	{
		"hitType": "F",
		"hitLoc": "78",
		"p": 1
	}],
	"CF": [
	{
		"hitType": "L",
		"hitLoc": "8",
		"p": 0.47
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.66
	},
	{
		"hitType": "L",
		"hitLoc": "89",
		"p": 0.77
	},
	{
		"hitType": "L",
		"hitLoc": "78",
		"p": 0.86
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.94
	},
	{
		"hitType": "F",
		"hitLoc": "8",
		"p": 1
	}],
	"RF": [
	{
		"hitType": "L",
		"hitLoc": "9",
		"p": 0.42
	},
	{
		"hitType": "L",
		"hitLoc": "89",
		"p": 0.67
	},
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.81
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.91
	},
	{
		"hitType": "L",
		"hitLoc": "9D",
		"p": 0.96
	},
	{
		"hitType": "F",
		"hitLoc": "89",
		"p": 1
	}],
	"x": [
	{
		"hitType": "G",
		"hitLoc": "34",
		"p": 0.09
	},
	{
		"hitType": "L",
		"hitLoc": "8",
		"p": 0.18
	},
	{
		"hitType": "G",
		"hitLoc": "56",
		"p": 0.26
	},
	{
		"hitType": "L",
		"hitLoc": "7",
		"p": 0.33
	},
	{
		"hitType": "L",
		"hitLoc": "9",
		"p": 0.4
	},
	{
		"hitType": "G",
		"hitLoc": "6",
		"p": 0.47
	},
	{
		"hitType": "L",
		"hitLoc": "89",
		"p": 0.53
	},
	{
		"hitType": "L",
		"hitLoc": "78",
		"p": 0.59
	},
	{
		"hitType": "G",
		"hitLoc": "6M",
		"p": 0.65
	},
	{
		"hitType": "G",
		"hitLoc": "4",
		"p": 0.71
	},
	{
		"hitType": "G",
		"hitLoc": "4M",
		"p": 0.76
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.79
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.82
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.85
	},
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.87
	},
	{
		"hitType": "G",
		"hitLoc": "3",
		"p": 0.89
	},
	{
		"hitType": "L",
		"hitLoc": "7L",
		"p": 0.91
	},
	{
		"hitType": "G",
		"hitLoc": "5",
		"p": 0.93
	},
	{
		"hitType": "F",
		"hitLoc": "8",
		"p": 0.95
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 0.96
	},
	{
		"hitType": "G",
		"hitLoc": "56S",
		"p": 0.97
	},
	{
		"hitType": "F",
		"hitLoc": "89",
		"p": 0.98
	},
	{
		"hitType": "L",
		"hitLoc": "9D",
		"p": 0.99
	},
	{
		"hitType": "F",
		"hitLoc": "78",
		"p": 1
	}]
};

const doubleHits = {
	"1B": [
	{
		"hitType": "G",
		"hitLoc": "3",
		"p": 0.71
	},
	{
		"hitType": "L",
		"hitLoc": "3",
		"p": 0.82
	},
	{
		"hitType": "P",
		"hitLoc": "3",
		"p": 0.93
	},
	{
		"hitType": "F",
		"hitLoc": "3",
		"p": 1
	}],
	"2B": [
	{
		"hitType": "G",
		"hitLoc": "4",
		"p": 0.56
	},
	{
		"hitType": "G",
		"hitLoc": "34",
		"p": 0.78
	},
	{
		"hitType": "G",
		"hitLoc": "4M",
		"p": 0.89
	},
	{
		"hitType": "L",
		"hitLoc": "34",
		"p": 1
	}],
	"3B": [
	{
		"hitType": "G",
		"hitLoc": "5",
		"p": 0.71
	},
	{
		"hitType": "G",
		"hitLoc": "56",
		"p": 0.89
	},
	{
		"hitType": "L",
		"hitLoc": "5",
		"p": 1
	}],
	"SS": [
	{
		"hitType": "G",
		"hitLoc": "6",
		"p": 0.62
	},
	{
		"hitType": "G",
		"hitLoc": "6M",
		"p": 0.85
	},
	{
		"hitType": "G",
		"hitLoc": "56",
		"p": 1
	}],
	"LF": [
	{
		"hitType": "L",
		"hitLoc": "7LD",
		"p": 0.3
	},
	{
		"hitType": "L",
		"hitLoc": "7L",
		"p": 0.59
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.75
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 0.83
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 0.9
	},
	{
		"hitType": "F",
		"hitLoc": "7LD",
		"p": 0.97
	},
	{
		"hitType": "F",
		"hitLoc": "7D",
		"p": 1
	}],
	"CF": [
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.29
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.58
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.73
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.83
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 0.93
	},
	{
		"hitType": "F",
		"hitLoc": "8D",
		"p": 1
	}],
	"RF": [
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.29
	},
	{
		"hitType": "L",
		"hitLoc": "9LD",
		"p": 0.58
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.75
	},
	{
		"hitType": "L",
		"hitLoc": "9D",
		"p": 0.83
	},
	{
		"hitType": "F",
		"hitLoc": "9LD",
		"p": 0.9
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.96
	},
	{
		"hitType": "F",
		"hitLoc": "9D",
		"p": 1
	}],
	"x": [
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.12
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.23
	},
	{
		"hitType": "L",
		"hitLoc": "7LD",
		"p": 0.33
	},
	{
		"hitType": "L",
		"hitLoc": "7L",
		"p": 0.42
	},
	{
		"hitType": "G",
		"hitLoc": "5",
		"p": 0.51
	},
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.59
	},
	{
		"hitType": "L",
		"hitLoc": "9LD",
		"p": 0.67
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 0.72
	},
	{
		"hitType": "G",
		"hitLoc": "3",
		"p": 0.76
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.8
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.83
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 0.86
	},
	{
		"hitType": "L",
		"hitLoc": "9D",
		"p": 0.88
	},
	{
		"hitType": "F",
		"hitLoc": "7LD",
		"p": 0.9
	},
	{
		"hitType": "F",
		"hitLoc": "8D",
		"p": 0.92
	},
	{
		"hitType": "F",
		"hitLoc": "9LD",
		"p": 0.94
	},
	{
		"hitType": "F",
		"hitLoc": "7D",
		"p": 0.96
	},
	{
		"hitType": "F",
		"hitLoc": "9D",
		"p": 0.98
	},
	{
		"hitType": "F",
		"hitLoc": "7L",
		"p": 0.99
	},
	{
		"hitType": "L",
		"hitLoc": "78",
		"p": 1
	}]
}

const tripleHits = {
	"LF": [
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 0.29
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.54
	},
	{
		"hitType": "G",
		"hitLoc": "7",
		"p": 0.65
	},
	{
		"hitType": "L",
		"hitLoc": "7LD",
		"p": 0.76
	},
	{
		"hitType": "F",
		"hitLoc": "7D",
		"p": 0.82
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 0.88
	},
	{
		"hitType": "L",
		"hitLoc": "7L",
		"p": 0.94
	},
	{
		"hitType": "F",
		"hitLoc": "7LD",
		"p": 1
	}],
	"CF": [
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.29
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.48
	},
	{
		"hitType": "F",
		"hitLoc": "8D",
		"p": 0.64
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.79
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.91
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 1
	}],
	"RF": [
	{
		"hitType": "L",
		"hitLoc": "9LD",
		"p": 0.22
	},
	{
		"hitType": "G",
		"hitLoc": "9",
		"p": 0.39
	},
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.56
	},
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.72
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.86
	},
	{
		"hitType": "F",
		"hitLoc": "9LD",
		"p": 0.94
	},
	{
		"hitType": "F",
		"hitLoc": "9D",
		"p": 1
	}],
	"x": [
	{
		"hitType": "L",
		"hitLoc": "89D",
		"p": 0.17
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 0.3
	},
	{
		"hitType": "L",
		"hitLoc": "9LD",
		"p": 0.41
	},
	{
		"hitType": "G",
		"hitLoc": "9",
		"p": 0.5
	},
	{
		"hitType": "L",
		"hitLoc": "9L",
		"p": 0.59
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 0.67
	},
	{
		"hitType": "L",
		"hitLoc": "78D",
		"p": 0.75
	},
	{
		"hitType": "F",
		"hitLoc": "8D",
		"p": 0.8
	},
	{
		"hitType": "L",
		"hitLoc": "8D",
		"p": 0.85
	},
	{
		"hitType": "F",
		"hitLoc": "9LD",
		"p": 0.89
	},
	{
		"hitType": "F",
		"hitLoc": "9D",
		"p": 0.92
	},
	{
		"hitType": "G",
		"hitLoc": "7",
		"p": 0.94
	},
	{
		"hitType": "L",
		"hitLoc": "7LD",
		"p": 0.96
	},
	{
		"hitType": "L",
		"hitLoc": "9",
		"p": 0.98
	},
	{
		"hitType": "L",
		"hitLoc": "7D",
		"p": 1
	}]
}

const hrHits = [
{
	"x": [
	{
		"hitType": "F",
		"hitLoc": "7LD",
		"p": 1 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "7D",
		"p": 2 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "78D",
		"p": 3 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "8D",
		"p": 4 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "89D",
		"p": 5 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "9D",
		"p": 6 / 7
	},
	{
		"hitType": "F",
		"hitLoc": "9LD",
		"p": 1
	}]
}];

export const hitList = {
	"1B": singleHits,
	"2B": doubleHits,
	"3B": tripleHits,
	"HR": hrHits,
}