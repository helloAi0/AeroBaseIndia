import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("./client", () => ({ api: { post: (...a: unknown[]) => post(...a) }, ApiError: class ApiError extends Error { status = 0; } }));
import { decodeJwt, loginWithBackend, LoginError } from "./auth";

const b64 = (o: object) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (claims: object) => `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;

describe("decodeJwt", () => {
  it("decodes url-safe base64 payloads incl. unicode and rejects garbage", () => {
    expect(decodeJwt(jwt({ name: "Zoë", n: 1 }))).toEqual({ name: "Zoë", n: 1 });
    expect(decodeJwt("abc")).toBeNull(); expect(decodeJwt("a.!!!.c")).toBeNull();
  });
});

describe("loginWithBackend role mapping", () => {
  beforeEach(() => post.mockReset());
  const login = async (claims: object) => { post.mockResolvedValue({ data: { token: jwt({ user_id: "u1", airport: "DEL", airport_name: "Delhi", exp: 2_000_000_000, ...claims }) } }); return loginWithBackend("a.b@x.in", "pw"); };

  it.each([
    ["SUPER_ADMIN", {}, "superadmin", undefined], ["AIRPORT_ADMIN", {}, "airport_admin", undefined],
    ["GROUND_STAFF", {}, "staff", "staff_ops"], ["SECURITY_OFFICER", {}, "staff", "staff_security"],
    ["PASSENGER", {}, "passenger", undefined], ["RETAILER", {}, "retailer", undefined],
    ["AIRLINE_OPS", { org: "UK" }, "staff", "airline_UK"], ["PILOT", { org: "AI" }, "staff", "pilot_captain_AI"],
  ])("%s → %s", async (role, extra, expRole, level) => {
    const s = await login({ role, ...extra });
    expect(s.user.role).toBe(expRole); expect(s.user.staffLevel).toBe(level);
    expect(s.user.airport).toBe("DEL"); expect(s.expiresAt).toBe(2_000_000_000_000);
  });
  it("sanitises org and rejects airline roles without one, and unknown roles", async () => {
    expect((await login({ role: "AIRLINE_OPS", org: "U-K;" })).user.staffLevel).toBe("airline_UK");
    await expect(login({ role: "AIRLINE_OPS" })).rejects.toMatchObject({ kind: "unsupported" });
    await expect(login({ role: "HACKER" })).rejects.toBeInstanceOf(LoginError);
  });
  it("maps HTTP failures: 401 invalid, 500/network unavailable, missing/malformed token unsupported", async () => {
    const axiosErr = (status?: number) => Object.assign(new Error("x"), { isAxiosError: true, response: status ? { status } : undefined });
    post.mockRejectedValue(axiosErr(401)); await expect(loginWithBackend("a", "b")).rejects.toMatchObject({ kind: "invalid" });
    post.mockRejectedValue(axiosErr(503)); await expect(loginWithBackend("a", "b")).rejects.toMatchObject({ kind: "unavailable" });
    post.mockRejectedValue(axiosErr()); await expect(loginWithBackend("a", "b")).rejects.toMatchObject({ kind: "unavailable" });
    post.mockResolvedValue({ data: {} }); await expect(loginWithBackend("a", "b")).rejects.toMatchObject({ kind: "unsupported" });
    post.mockResolvedValue({ data: { token: "not.a.jwt" } }); await expect(loginWithBackend("a", "b")).rejects.toMatchObject({ kind: "unsupported" });
  });
});
