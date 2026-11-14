/** Lounge facts compiled from operator and bank published terms. Cards and fees change often: the page tells people to confirm with their issuer. */
export interface Lounge { name: string; operator: string; terminal: string; zone: "Domestic" | "International" | "Both"; hours: string }
export const LOUNGES: Record<string, Lounge[]> = {
  DEL: [{ name: "Encalm Lounge T1", operator: "Encalm", terminal: "T1", zone: "Domestic", hours: "24 hours" }, { name: "Encalm Lounge T2", operator: "Encalm", terminal: "T2", zone: "Domestic", hours: "24 hours" }, { name: "Encalm Lounge T3", operator: "Encalm", terminal: "T3", zone: "Both", hours: "24 hours" }],
  BOM: [{ name: "Travel Club Lounge", operator: "Travel Club", terminal: "T1C", zone: "Domestic", hours: "24 hours" }, { name: "Adani Lounge", operator: "Adani", terminal: "T2", zone: "International", hours: "24 hours" }, { name: "Adani Lounge", operator: "Adani", terminal: "T1B", zone: "Domestic", hours: "24 hours" }],
  BLR: [{ name: "BLR Domestic Lounge", operator: "BLR Airport", terminal: "T1", zone: "Domestic", hours: "24 hours" }, { name: "080 Domestic Lounge", operator: "080", terminal: "T2", zone: "Domestic", hours: "24 hours" }],
  HYD: [{ name: "Encalm Lounge", operator: "Encalm", terminal: "Main", zone: "Both", hours: "24 hours" }],
  MAA: [{ name: "Travel Club Lounge", operator: "Travel Club", terminal: "T1", zone: "Domestic", hours: "24 hours" }, { name: "Travel Club Lounge", operator: "Travel Club", terminal: "T4", zone: "International", hours: "24 hours" }],
  CCU: [{ name: "Travel Club Lounge", operator: "Travel Club", terminal: "T1", zone: "Both", hours: "24 hours" }],
  COK: [{ name: "Earth Lounge", operator: "Earth", terminal: "T3", zone: "Both", hours: "24 hours" }],
  AMD: [{ name: "The Lounge", operator: "The Lounge", terminal: "T1", zone: "Both", hours: "24 hours" }],
  GOI: [{ name: "Encalm Lounge", operator: "Encalm", terminal: "Main", zone: "Both", hours: "24 hours" }],
};
export const WALK_IN = { domestic: 2550, international: 4150, hours: 2 };

export type Method = "bank" | "priority" | "airline" | "walkin";
export const METHODS: { id: Method; label: string; rule: string }[] = [
  { id: "bank", label: "Credit or debit card", rule: "Your bank allows free visits on eligible cards. Present the card and a same-day boarding pass at the door. Many cards charge a small verification amount (about ₹2 on Visa and RuPay, about ₹25 on Mastercard, depending on the bank) to check the card is active. RuPay authorisations are normally not refunded." },
  { id: "priority", label: "Priority Pass / overseas lounge programme", rule: "Works at partner lounges abroad (Dubai, London and others). A visit is usually charged to the member only if the free quota is used up, roughly USD 27–35 per guest. Show the membership card and your boarding pass." },
  { id: "airline", label: "Airline ticket (business class or status)", rule: "Business class and top-tier frequent flyers get the airline's own lounge or a partner lounge. Your boarding pass is the entry proof." },
  { id: "walkin", label: "Pay at the door", rule: "Anyone with a same-day boarding pass can walk in when there is space and pay the published rate for a two-hour stay." },
];
export const COMMON_RULES = ["A boarding pass for a flight leaving the same day is required.", "The name on the card should match the name on the boarding pass.", "Domestic lounges need a domestic boarding pass; international lounges need an international one.", "Several banks ended domestic lounge access through the DreamFolks network in September 2025, so confirm with your own bank before you rely on it."];
