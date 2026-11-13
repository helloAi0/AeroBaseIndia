#!/usr/bin/env python3
"""Download real public datasets and build the reference JSON files used by the app (scripts/data/*.json).

Sources (all on GitHub, public):
  * OurAirports  — airports.csv, runways.csv   (https://github.com/davidmegginson/ourairports-data, public domain)
  * OpenFlights  — airlines.dat, routes.dat    (https://github.com/jpatokal/openflights, ODbL; route data is a 2017 snapshot)
Usage:  python3 scripts/build_reference_from_online.py [download_dir]
Re-run any time to refresh; the generated JSON is committed so the app works offline.
"""
import csv, io, json, os, sys, urllib.request
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
BASE = {"oa": "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/", "of": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/"}
# Airlines that stopped flying or were merged since the OpenFlights snapshot (Vistara & AirAsia India -> Air India group, Jet, GoAir/Go First, ...)
DEFUNCT = {"UK", "I5", "9W", "S2", "G8", "DN", "2T", "6S", "IT", "OG"}
SUCCESSOR = {"UK": "AI", "I5": "IX", "G8": "6E"}   # their routes are flown today by the group airline
# Airlines that began after the snapshot (public knowledge: Akasa Air started 2022, Star Air 2019, Fly91 2024)
ADD_AIRLINES = [("QP", "AKJ", "Akasa Air", "IN"), ("S5", "SDG", "Star Air", "IN")]
EQUIP = {"320": "A320", "32N": "A320neo", "32A": "A320", "32B": "A320", "321": "A321neo", "32Q": "A321neo", "319": "A319", "738": "B737-800", "73H": "B737-800", "73G": "B737-700", "737": "B737-700",
         "7M8": "B737-8", "788": "B787-8", "789": "B787-9", "77W": "B777-300ER", "773": "B777-300ER", "77L": "B777-200LR", "772": "B777-200LR", "359": "A350-900", "333": "A330-300", "332": "A330-200", "388": "A380", "744": "B747-400", "AT7": "ATR72", "AT5": "ATR72", "ATR": "ATR72"}
KEEP_INTL = 40   # busiest foreign airports (by number of Indian routes) to keep alongside the Indian ones

def fetch(name, src, cache):
    path = os.path.join(cache, name)
    if not os.path.exists(path):
        os.makedirs(cache, exist_ok=True); print("downloading", name); urllib.request.urlretrieve(BASE[src] + name, path)
    return open(path, encoding="utf-8", newline="")

def main():
    cache = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get("TMPDIR", "/tmp"), "aerobase-datasets")
    airports = {r["iata_code"]: r for r in csv.DictReader(fetch("airports.csv", "oa", cache)) if r["iata_code"] and r["scheduled_service"] == "yes"}
    runways = {}
    for r in csv.DictReader(fetch("runways.csv", "oa", cache)):
        if r["closed"] == "1" or not r["length_ft"]: continue
        d = runways.setdefault(r["airport_ident"], {"n": 0, "longest_m": 0}); d["n"] += 1; d["longest_m"] = max(d["longest_m"], round(int(float(r["length_ft"])) * 0.3048))
    airlines = {}
    for row in csv.reader(fetch("airlines.dat", "of", cache)):
        if len(row) >= 8 and row[3] not in ("", "\\N", "-") and len(row[3]) <= 3 and row[7] == "Y": airlines.setdefault(row[3], {"iata": row[3], "icao": row[4] if row[4] != "\\N" else "", "name": row[1], "country": row[6]})
    routes = {}
    for row in csv.reader(fetch("routes.dat", "of", cache)):
        al, src, dst, share, stops, eq = row[0], row[2], row[4], row[6], row[7], row[8]
        if share == "Y" or stops != "0" or src not in airports or dst not in airports or airports[src]["iso_country"] != "IN": continue
        al = SUCCESSOR.get(al, al)
        if al in DEFUNCT or al not in airlines: continue
        types = sorted({EQUIP[e] for e in eq.split() if e in EQUIP})
        routes[(src, dst, al)] = types
    # demand proxy: how many airlines fly the route
    pair = {}
    for (s, d, a) in routes: pair[(s, d)] = pair.get((s, d), 0) + 1
    foreign = {}
    for (s, d, a) in routes:
        if airports[d]["iso_country"] != "IN": foreign[d] = foreign.get(d, 0) + 1
    keep = {c for c, r in airports.items() if r["iso_country"] == "IN"} | {c for c, _ in sorted(foreign.items(), key=lambda kv: -kv[1])[:KEEP_INTL]}
    outA = []
    for c in sorted(keep):
        r = airports[c]; rw = runways.get(r["ident"], {})
        outA.append({"iata": c, "icao": r["ident"], "name": r["name"], "city": r["municipality"], "country": r["iso_country"], "lat": round(float(r["latitude_deg"]), 4), "lon": round(float(r["longitude_deg"]), 4),
                     "elevation_ft": int(float(r["elevation_ft"])) if r["elevation_ft"] else None, "type": r["type"], "runways": rw.get("n", 0), "longest_runway_m": rw.get("longest_m", 0)})
    used = {a for (_, _, a) in routes}
    outL = [airlines[a] | {"active": True} for a in sorted(used)]
    have = {x["iata"] for x in outL}
    for iata, icao, name, cc in ADD_AIRLINES:
        if iata not in have: outL.append({"iata": iata, "icao": icao, "name": name, "country": cc, "active": True})
    outR = [{"from": s, "to": d, "airline": a, "types": t, "airlines_on_route": pair[(s, d)]} for (s, d, a), t in sorted(routes.items()) if d in keep]
    for name, data in (("airports.json", outA), ("airlines.json", outL), ("routes.json", outR)):
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"airports {len(outA)}, airlines {len(outL)}, routes {len(outR)}  (from DEL: {sum(1 for r in outR if r['from']=='DEL')}, BOM: {sum(1 for r in outR if r['from']=='BOM')}, BLR: {sum(1 for r in outR if r['from']=='BLR')})")

if __name__ == "__main__": main()
