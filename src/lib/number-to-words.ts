import Decimal from "decimal.js";
import { toDecimal, type MoneyInput } from "@/lib/money";

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

/** Converts an integer 0-999 to words, joining a hundreds part and a tens/ones part with "&". */
function threeDigitsToWords(n: number): string {
  if (n === 0) return "";

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  const hundredsWords = hundreds > 0 ? `${ONES[hundreds]} Hundred` : "";

  let remainderWords = "";
  if (remainder > 0) {
    if (remainder < 20) {
      remainderWords = ONES[remainder];
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      remainderWords = ones > 0 ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
    }
  }

  if (hundredsWords && remainderWords) return `${hundredsWords} & ${remainderWords}`;
  return hundredsWords || remainderWords;
}

function integerToWords(value: number): string {
  if (value === 0) return "Zero";

  const groups: number[] = [];
  let remaining = Math.trunc(value);
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i];
    if (groupValue === 0) continue;
    const words = threeDigitsToWords(groupValue);
    parts.push(SCALES[i] ? `${words} ${SCALES[i]}` : words);
  }

  return parts.join(" ");
}

export function numberToWords(
  amount: MoneyInput,
  opts?: { currencyName?: string; subunitName?: string }
): string {
  const decimal = toDecimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).abs();
  const wholePart = decimal.trunc().toNumber();
  const fractionPart = Math.round(decimal.minus(decimal.trunc()).times(100).toNumber());

  const subunitName = opts?.subunitName ?? "Paisa";
  const wholeWords = integerToWords(wholePart);

  if (fractionPart > 0) {
    const fractionWords = integerToWords(fractionPart);
    return `${wholeWords} and ${fractionWords} ${subunitName} Only`;
  }

  return `${wholeWords} Only`;
}
