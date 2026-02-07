/**
 * Mozart's Musikalisches Würfelspiel (Musical Dice Game) K.516f
 *
 * Historically accurate lookup tables for generating minuets and trios.
 * Each table maps dice results to pre-composed measure IDs.
 */

/**
 * Minuet table: 11 rows (dice sums 2–12) × 16 columns (bars 1–16).
 *
 * Access: mozartMinuetTable[diceSum - 2][barIndex]
 *   - diceSum ranges from 2 to 12 (index 0–10)
 *   - barIndex ranges from 0 to 15 (bars 1–16)
 *   - Returns a measure ID from the pool of 176 pre-composed fragments.
 */
export const mozartMinuetTable: readonly (readonly number[])[] = [
  //  Bar1  Bar2  Bar3  Bar4  Bar5  Bar6  Bar7  Bar8  Bar9 Bar10 Bar11 Bar12 Bar13 Bar14 Bar15 Bar16
  [  96,  22, 141,  41, 105, 122,  11,  30,  70, 121,  26,   9, 112,  49, 109,  14], // sum = 2
  [  32,   6, 128,  63, 146,  46, 134,  81, 117,  39, 126,  56, 174,  18, 116,  83], // sum = 3
  [  69,  95, 158,  13, 153,  55, 110,  24,  66, 139,  15, 132,  73,  58, 145,  79], // sum = 4
  [  40,  17, 113,  85, 161,   2, 159, 100,  90, 176,   7,  34,  67, 160,  52, 170], // sum = 5
  [ 148,  74, 163,  45,  80,  97,  36, 107,  25, 143,  64, 125,  76, 136,   1,  93], // sum = 6
  [ 104, 157,  27, 167, 154,  68, 118,  91, 138,  71, 150,  29, 101, 162,  23, 151], // sum = 7
  [ 152,  60, 171,  53,  99, 133,  21, 127,  16, 155,  57, 175,  43, 168,  89, 172], // sum = 8
  [ 119,  84, 114,  50, 140,  86, 169,  94, 120,  88,  48, 166,  51, 115,  72, 111], // sum = 9
  [  98, 142,  42, 156,  75, 129,  62, 123,  65,  77,  19,  82, 137,  38, 149,   8], // sum = 10
  [   3,  87, 165,  61, 135,  47, 147,  33, 102,   4,  31, 164, 144,  59, 173,  78], // sum = 11
  [  54, 130,  10, 103,  28,  37, 106,   5,  35,  20, 108,  92,  12, 124,  44, 131], // sum = 12
] as const;

/**
 * Trio table: 6 rows (single die 1–6) × 16 columns (bars 1–16).
 *
 * Access: mozartTrioTable[dieValue - 1][barIndex]
 *   - dieValue ranges from 1 to 6 (index 0–5)
 *   - barIndex ranges from 0 to 15 (bars 1–16)
 *   - Returns a measure ID from the pool of 96 pre-composed trio fragments.
 */
export const mozartTrioTable: readonly (readonly number[])[] = [
  //  Bar1  Bar2  Bar3  Bar4  Bar5  Bar6  Bar7  Bar8  Bar9 Bar10 Bar11 Bar12 Bar13 Bar14 Bar15 Bar16
  [  72,   6,  59,  25,  81,  41,  89,  13,  36,   5,  46,  79,  30,  95,  19,  66], // die = 1
  [  56,  82,  42,  74,  14,   7,  26,  71,  76,  20,  64,  84,   8,  35,  47,  88], // die = 2
  [  75,  39,  54,   1,  65,  43,  15,  80,   9,  34,  93,  48,  69,  58,  90,  21], // die = 3
  [  40,  73,  16,  68,  29,  55,   2,  61,  22,  67,  49,  77,  57,  87,  33,  10], // die = 4
  [  83,   3,  28,  53,  37,  17,  44,  70,  63,  85,  32,  96,  12,  23,  50,  91], // die = 5
  [  18,  45,  62,  38,   4,  27,  52,  94,  11,  92,  24,  86,  51,  60,  78,  31], // die = 6
] as const;
