export const rollTests = {
  unequal: (dice, count, target) => {
    const unique = [...new Set(dice)].length;
    return unique >= count
  },
  odd: (dice, count, target) => {
    let countOdd = 0;
    for (let i = 0; i < dice.length; i++) {
      dice[i] % 2 != 0 ? countOdd++ : countOdd += 0;
    }
    return countOdd >= count
  },
  even: (dice, count, target) => {
    let countEven = 0;
    for (let i = 0; i < dice.length; i++) {
      dice[i] % 2 === 0 ? countEven++ : countEven += 0;
    }
    return countEven >= count
  },
  sum: (dice, count, target) => {
    const diceSum = dice.reduce((acc, item) => acc + item, 0);
    return diceSum >= target
  },
  max: (dice, count, target) => {
    const diceMax = Math.max(...dice);
    return diceMax >= target
  },
  straight: (dice, count, target) => {
    const uniqueSorted = [...new Set(dice)].sort((a, b) => a - b);
    
    // A straight of 3 requires a span of at most 2 across 3 elements
    for (let i = 0; i <= uniqueSorted.length - target; i++) {
      if (uniqueSorted[i + target - 1] - uniqueSorted[i] === target - 1) {
        return true;
      }
    }
    return false;
  },
  value: (dice, count, target) => {
    const valCount = dice.filter(res => res === target).length;
    return valCount >= count
  },
  over: (dice, count, target) => {
  const valCount = dice.filter(res => res >= target).length;
  return valCount >= count
},
  pairs: (dice, count, target) => {
    const counts = {};
    for (const num of dice) {
      counts[num] = (counts[num] || 0) + 1;
    }
    const pairs = Object.values(counts).filter(vcount => vcount >= 2).length;
    return pairs >= count
  },
  match: (dice, count, target) => {
    const counts = {};
    for (const num of dice) {
      counts[num] = (counts[num] || 0) + 1;
    }
    const sets = Object.values(counts).filter(mcount => mcount >= count).length;
    return sets > 0
  },
  range: (dice, count, target) => {
    const diceMax = Math.max(...dice);
    const diceMin = Math.min(...dice);
    const diceRange = diceMax - diceMin;
    return diceRange>=target
  }
}