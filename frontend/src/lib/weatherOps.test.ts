import { describe, it, expect } from "vitest";
import { triggered, parseWx, upcoming, describeCode } from "./weatherOps";

const calm = { temp: 28, feels: 30, precip: 0, code: 1, gust: 12, visibilityM: 10000 };
describe("weather → playbook rules", () => {
  it("normal weather triggers nothing", () => expect(triggered(calm)).toEqual([]));
  it("fog by code or by visibility", () => { expect(triggered({ ...calm, code: 45 })).toContain("fog"); expect(triggered({ ...calm, visibilityM: 500 })).toContain("fog"); });
  it("storm outranks wind; heavy rain, heat and cold", () => {
    expect(triggered({ ...calm, code: 95, gust: 70 })).toEqual(["storm"]);
    expect(triggered({ ...calm, gust: 50 })).toEqual(["wind"]);
    expect(triggered({ ...calm, precip: 4 })).toEqual(["rain"]); expect(triggered({ ...calm, feels: 44 })).toEqual(["heat"]); expect(triggered({ ...calm, temp: 0 })).toEqual(["cold"]);
  });
  it("parses an Open-Meteo payload and finds upcoming events", () => {
    const j = { current: { temperature_2m: 30.4, apparent_temperature: 33, relative_humidity_2m: 40, precipitation: 0, weather_code: 1, wind_speed_10m: 10, wind_gusts_10m: 20, visibility: 9000 },
      hourly: { time: ["t0", "t1", "t2"], temperature_2m: [30, 30, 29], precipitation_probability: [0, 90, 10], weather_code: [1, 95, 1], wind_gusts_10m: [20, 65, 20], visibility: [9000, 4000, 9000] } };
    const w = parseWx(j); expect(w.temp).toBe(30); expect(upcoming(w)).toContainEqual({ t: "t1", id: "storm" });
  });
  it("describes codes", () => expect(describeCode(45)).toBe("Fog"));
});
