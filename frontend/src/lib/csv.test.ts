import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => { expect(toCsv([{ a: 'x,"y"', b: "l1\nl2" }])).toBe('a,b\r\n"x,""y""","l1\nl2"'); });
  it("neutralises spreadsheet formulas", () => { expect(toCsv([{ a: "=SUM(A1)", b: "+1", c: "ok" }])).toBe("a,b,c\r\n'=SUM(A1),'+1,ok"); });
  it("uses the union of keys and blanks missing cells", () => { expect(toCsv([{ a: 1 }, { b: 2 }])).toBe("a,b\r\n1,\r\n,2"); });
});
