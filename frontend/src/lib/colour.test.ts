import { describe, expect, it } from "vitest";
import { nameColour } from "./colour";

describe("nameColour", () => {
  it.each([
    [0, 0, 0, "black"], [255, 255, 255, "white"], [128, 128, 128, "grey"], [220, 30, 30, "red"], [30, 200, 40, "green"],
    [30, 60, 220, "blue"], [250, 220, 20, "yellow"], [250, 140, 20, "orange"], [140, 40, 200, "purple"], [110, 60, 30, "brown"],
  ])("rgb(%i,%i,%i) is %s", (r, g, b, name) => { expect(nameColour(r, g, b)).toBe(name); });
});
