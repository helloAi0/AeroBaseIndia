/** Airport reference points (lat, lon) used for weather and maps. Other airports are looked up from /api/reference/airports. */
export const AIRPORT_COORDS: Record<string, [number, number]> = {
  DEL: [28.5562, 77.1], BOM: [19.0896, 72.8656], BLR: [13.1979, 77.7063], HYD: [17.2403, 78.4294], CCU: [22.6547, 88.4467], MAA: [12.99, 80.1693],
  COK: [10.152, 76.4019], GOI: [15.7443, 73.8607], AMD: [23.0772, 72.6347], PNQ: [18.5821, 73.9197], JAI: [26.8242, 75.8122], GAU: [26.1061, 91.5859],
  SXR: [33.9871, 74.7742], LKO: [26.7606, 80.8893], TRV: [8.4821, 76.9201],
};
