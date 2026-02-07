import { describe, it, expect } from "vitest";
import { rollDice, generateMinuet } from "../generateMinuet";
import { mozartMinuetTable } from "../mozartTables";
import type { DiceRoll } from "@/lib/domain/types";

describe("rollDice", () => {
  it("returns a valid DiceRoll with die values 1-6", () => {
    for (let i = 0; i < 100; i++) {
      const roll = rollDice();
      expect(roll.die1).toBeGreaterThanOrEqual(1);
      expect(roll.die1).toBeLessThanOrEqual(6);
      expect(roll.die2).toBeGreaterThanOrEqual(1);
      expect(roll.die2).toBeLessThanOrEqual(6);
      expect(roll.sum).toBe(roll.die1 + roll.die2);
    }
  });
});

describe("generateMinuet", () => {
  it("returns 16 measure IDs when no fixed rolls provided", () => {
    const result = generateMinuet();
    expect(result.rolls).toHaveLength(16);
    expect(result.measureIds).toHaveLength(16);
  });

  it("produces deterministic output for fixed dice rolls", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 3,
      die2: 4,
      sum: 7,
    }));

    const result1 = generateMinuet(fixedRolls);
    const result2 = generateMinuet(fixedRolls);

    expect(result1.measureIds).toEqual(result2.measureIds);
  });

  it("looks up correct measure IDs from the table", () => {
    // All dice sum to 7 (index 5 in the table)
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 3,
      die2: 4,
      sum: 7,
    }));

    const result = generateMinuet(fixedRolls);

    // Sum 7 => table row index 5 (7 - 2 = 5)
    for (let bar = 0; bar < 16; bar++) {
      expect(result.measureIds[bar]).toBe(mozartMinuetTable[5][bar]);
    }
  });

  it("handles minimum dice sum (2)", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 1,
      die2: 1,
      sum: 2,
    }));

    const result = generateMinuet(fixedRolls);
    for (let bar = 0; bar < 16; bar++) {
      expect(result.measureIds[bar]).toBe(mozartMinuetTable[0][bar]);
    }
  });

  it("handles maximum dice sum (12)", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 6,
      die2: 6,
      sum: 12,
    }));

    const result = generateMinuet(fixedRolls);
    for (let bar = 0; bar < 16; bar++) {
      expect(result.measureIds[bar]).toBe(mozartMinuetTable[10][bar]);
    }
  });

  it("throws on invalid die1 value (0)", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 0,
      die2: 3,
      sum: 3,
    }));

    expect(() => generateMinuet(fixedRolls)).toThrow("Invalid dice values");
  });

  it("throws on invalid die2 value (7)", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 3,
      die2: 7,
      sum: 10,
    }));

    expect(() => generateMinuet(fixedRolls)).toThrow("Invalid dice values");
  });

  it("throws on inconsistent sum", () => {
    const fixedRolls: DiceRoll[] = Array.from({ length: 16 }, () => ({
      die1: 3,
      die2: 4,
      sum: 8, // should be 7
    }));

    expect(() => generateMinuet(fixedRolls)).toThrow("Inconsistent dice sum");
  });
});
