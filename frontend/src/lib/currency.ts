import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export interface Currency { code: string; symbol: string; inrPer: number; locale: string }
/** Local currency per airport. `inrPer` is an indicative rupee value of one unit, used only to show booking fares, which the server prices in rupees. */
const INR: Currency = { code: "INR", symbol: "₹", inrPer: 1, locale: "en-IN" };
const AED: Currency = { code: "AED", symbol: "AED ", inrPer: 24, locale: "en-AE" };
const BY_AIRPORT: Record<string, Currency> = {
  DXB: AED, AUH: AED,
  DOH: { code: "QAR", symbol: "QAR ", inrPer: 24, locale: "en-QA" },
  LHR: { code: "GBP", symbol: "£", inrPer: 112, locale: "en-GB" },
  SIN: { code: "SGD", symbol: "S$", inrPer: 65, locale: "en-SG" },
};
export const currencyFor = (airport: string): Currency => BY_AIRPORT[airport] ?? INR;

/** The airport the screen is showing: the platform owner's chosen one, otherwise the signed-in user's. */
export function activeAirportCode(): string {
  const u = useAuthStore.getState().user; const a = useAppStore.getState().activeAirport;
  return (u?.role === "superadmin" && a) || u?.airport || "DEL";
}
export const activeCurrency = () => currencyFor(activeAirportCode());

const fmt = (n: number, c: Currency, dp = 0) => c.symbol + Number(n).toLocaleString(c.locale, { minimumFractionDigits: dp, maximumFractionDigits: dp });
/** An amount already in the airport's own currency (shop prices, local fees). */
export const money = (n: number, c: Currency = activeCurrency()) => fmt(n, c, c.code === "INR" || n % 1 === 0 ? 0 : 2);
/** An amount computed in rupees (fares, revenue), shown in the airport's currency. */
export const fromInr = (n: number, c: Currency = activeCurrency()) => c.code === "INR" ? fmt(n, c) : fmt(n / c.inrPer, c, 0);
export const inrToLocalNumber = (n: number, c: Currency = activeCurrency()) => n / c.inrPer;
