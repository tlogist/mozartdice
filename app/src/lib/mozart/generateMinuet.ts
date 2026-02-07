import type { DiceRoll } from "@/lib/domain/types";
import { mozartMinuetTable } from "./mozartTables";

/** Roll two six-sided dice and return the result. */
export function rollDice(): DiceRoll {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, sum: die1 + die2 };
}

/** Validate that a DiceRoll has valid die values (1-6). */
function validateRoll(roll: DiceRoll, barIndex: number): void {
  if (roll.die1 < 1 || roll.die1 > 6 || roll.die2 < 1 || roll.die2 > 6) {
    throw new Error(
      `Invalid dice values for bar ${barIndex + 1}: die1=${roll.die1}, die2=${roll.die2}. Each die must be 1-6.`
    );
  }
  if (roll.sum !== roll.die1 + roll.die2) {
    throw new Error(
      `Inconsistent dice sum for bar ${barIndex + 1}: die1=${roll.die1} + die2=${roll.die2} should equal ${roll.die1 + roll.die2}, got ${roll.sum}.`
    );
  }
}

/**
 * Generate a 16-bar minuet by looking up measure IDs from the Mozart table.
 *
 * @param fixedRolls - Optional array of 16 DiceRoll objects for deterministic output.
 *                     If omitted, random rolls are generated.
 * @returns An array of 16 measure IDs, one per bar.
 */
export function generateMinuet(fixedRolls?: DiceRoll[]): {
  rolls: DiceRoll[];
  measureIds: number[];
} {
  const rolls: DiceRoll[] = [];
  const measureIds: number[] = [];

  for (let bar = 0; bar < 16; bar++) {
    const roll = fixedRolls ? fixedRolls[bar] : rollDice();
    if (fixedRolls) {
      validateRoll(roll, bar);
    }
    rolls.push(roll);
    // Dice sum ranges 2-12, table index = sum - 2
    measureIds.push(mozartMinuetTable[roll.sum - 2][bar]);
  }

  return { rolls, measureIds };
}
