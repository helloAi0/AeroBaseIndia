"""Reference data: real airports, airlines and aircraft types (public IATA/ICAO data, coordinates rounded to 4 dp,
seat counts and cruise fuel burn are typical published figures). Distances and block times are computed from coordinates."""
import math

import json, os
_D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
def _load(n):
    with open(os.path.join(_D, n), encoding="utf-8") as f: return json.load(f)
_AP, _AL, _RT = _load("airports.json"), _load("airlines.json"), _load("routes.json")
# iata, icao, name, city, country, lat, lon, elevation_ft, type, runways, longest_runway_m   (OurAirports)
AIRPORTS = [(x["iata"], x["icao"], x["name"], x["city"], x["country"], x["lat"], x["lon"], x["elevation_ft"], x["type"], x["runways"], x["longest_runway_m"]) for x in _AP]
# iata, icao, name, country, active   (OpenFlights, minus airlines that no longer exist)
AIRLINES = [(x["iata"], x["icao"], x["name"], x["country"], True) for x in _AL]
# type, name, seats, typical cruise fuel burn kg/h, range km, cruise km/h
AIRCRAFT = [
 ("A320neo","Airbus A320neo",186,2250,6300,830),("A320","Airbus A320-200",180,2500,6100,830),("A321neo","Airbus A321neo",222,2550,7400,830),
 ("B737-800","Boeing 737-800",189,2600,5700,830),("B737-8","Boeing 737 MAX 8",189,2300,6500,830),("ATR72","ATR 72-600",72,650,1500,510),
 ("B787-8","Boeing 787-8 Dreamliner",256,5400,13600,900),("B787-9","Boeing 787-9 Dreamliner",296,5700,14100,900),("B777-300ER","Boeing 777-300ER",342,7500,13650,905),
 ("A350-900","Airbus A350-900",300,5900,15000,910),("A330-300","Airbus A330-300",290,5800,11750,870),("A380","Airbus A380-800",489,11000,15200,900),
 ("A319","Airbus A319",144,2100,6850,830),("B737-700","Boeing 737-700",140,2400,6000,830),("A330-200","Airbus A330-200",250,5600,13400,870),
 ("B777-200LR","Boeing 777-200LR",301,7400,15800,905),("B747-400","Boeing 747-400",416,10500,13450,910),
]

def airport(iata): return next(a for a in AIRPORTS if a[0] == iata)
def distance_km(a, b):
    p1, p2 = math.radians(airport(a)[5]), math.radians(airport(b)[5]); dl = math.radians(airport(b)[6] - airport(a)[6]); dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(h))
def block_minutes(a, b, cruise_kmh=830):
    return int(round(distance_km(a, b) / cruise_kmh * 60 + 35, -1))   # +35 min taxi/climb/descent

# Real routes flown from each airport (OpenFlights): (to, airline, equipment types, airlines on the route)
ROUTES = {}
for _r in _RT: ROUTES.setdefault(_r["from"], []).append((_r["to"], _r["airline"], _r["types"], _r["airlines_on_route"]))
# Airlines that began after the OpenFlights snapshot (added from public schedules) for the three demo airports.
for _src, _items in {"DEL": [("QP", ["BOM","BLR","AMD","PNQ","GOI","HYD"], ["B737-8"])], "BOM": [("QP", ["DEL","BLR","AMD","GOI","HYD"], ["B737-8"])], "BLR": [("QP", ["DEL","BOM","HYD","PNQ","AMD"], ["B737-8"])]}.items():
    for _al, _dests, _t in _items:
        for _d in _dests:
            if not any(x[0] == _d and x[1] == _al for x in ROUTES.get(_src, [])): ROUTES.setdefault(_src, []).append((_d, _al, _t, 1))
LOW_COST = {"6E", "SG", "QP", "S5", "IX", "9I"}
def terminal(code, airline, intl):
    """Terminal each airline uses at our three airports (public airport terminal allocations)."""
    if code == "DEL": return "T1" if airline in {"6E", "SG", "QP", "S5", "9I"} else "T3"
    if code == "BOM": return "T1" if airline in {"6E", "SG", "QP", "9I", "S5"} and not intl else "T2"
    return "T1" if airline in {"6E", "SG", "QP", "S5", "9I", "IX"} and not intl else "T2"
