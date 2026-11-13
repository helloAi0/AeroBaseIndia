"""Reference data: real airports, airlines and aircraft types (public IATA/ICAO data, coordinates rounded to 4 dp,
seat counts and cruise fuel burn are typical published figures). Distances and block times are computed from coordinates."""
import math

# iata, icao, name, city, country, lat, lon
AIRPORTS = [
 ("DEL","VIDP","Indira Gandhi International","Delhi","IN",28.5562,77.1000),("BOM","VABB","Chhatrapati Shivaji Maharaj International","Mumbai","IN",19.0896,72.8656),
 ("BLR","VOBL","Kempegowda International","Bengaluru","IN",13.1979,77.7063),("HYD","VOHS","Rajiv Gandhi International","Hyderabad","IN",17.2403,78.4294),
 ("MAA","VOMM","Chennai International","Chennai","IN",12.9941,80.1709),("CCU","VECC","Netaji Subhas Chandra Bose International","Kolkata","IN",22.6547,88.4467),
 ("AMD","VAAH","Sardar Vallabhbhai Patel International","Ahmedabad","IN",23.0772,72.6347),("PNQ","VAPO","Pune","Pune","IN",18.5821,73.9197),
 ("GOI","VAGO","Dabolim","Goa","IN",15.3808,73.8314),("COK","VOCI","Cochin International","Kochi","IN",10.1520,76.4019),
 ("JAI","VIJP","Jaipur International","Jaipur","IN",26.8242,75.8122),("LKO","VILK","Chaudhary Charan Singh International","Lucknow","IN",26.7606,80.8893),
 ("GAU","VEGT","Lokpriya Gopinath Bordoloi International","Guwahati","IN",26.1061,91.5859),("PAT","VEPT","Jay Prakash Narayan International","Patna","IN",25.5913,85.0880),
 ("BBI","VEBS","Biju Patnaik International","Bhubaneswar","IN",20.2444,85.8178),("IXC","VICG","Chandigarh International","Chandigarh","IN",30.6735,76.7885),
 ("SXR","VISR","Sheikh ul-Alam International","Srinagar","IN",33.9871,74.7742),("TRV","VOTV","Trivandrum International","Thiruvananthapuram","IN",8.4821,76.9201),
 ("IDR","VAID","Devi Ahilya Bai Holkar","Indore","IN",22.7218,75.8011),("NAG","VANP","Dr. Babasaheb Ambedkar International","Nagpur","IN",21.0922,79.0472),
 ("VNS","VEBN","Lal Bahadur Shastri International","Varanasi","IN",25.4524,82.8593),("IXB","VEBD","Bagdogra","Siliguri","IN",26.6812,88.3286),
 ("RPR","VERP","Swami Vivekananda","Raipur","IN",21.1804,81.7388),("IXR","VERC","Birsa Munda","Ranchi","IN",23.3143,85.3217),
 ("CJB","VOCB","Coimbatore International","Coimbatore","IN",11.0300,77.0434),("VTZ","VOVZ","Visakhapatnam","Visakhapatnam","IN",17.7212,83.2245),
 ("ATQ","VIAR","Sri Guru Ram Dass Jee International","Amritsar","IN",31.7096,74.7973),("UDR","VAUD","Maharana Pratap","Udaipur","IN",24.6177,73.8961),
 ("IXM","VOMD","Madurai","Madurai","IN",9.8345,78.0934),("IXE","VOML","Mangaluru International","Mangaluru","IN",12.9613,74.8901),
 ("BDQ","VABO","Vadodara","Vadodara","IN",22.3362,73.2263),("STV","VASU","Surat","Surat","IN",21.1141,72.7418),
 ("JDH","VIJO","Jodhpur","Jodhpur","IN",26.2511,73.0489),("DED","VIDN","Jolly Grant","Dehradun","IN",30.1897,78.1803),
 ("IXL","VILH","Kushok Bakula Rimpochee","Leh","IN",34.1359,77.5465),("DIB","VEMN","Dibrugarh","Dibrugarh","IN",27.4839,95.0169),
 ("IMF","VEIM","Imphal International","Imphal","IN",24.7600,93.8967),("AGR","VIAG","Agra","Agra","IN",27.1558,77.9609),
 ("HBX","VAHB","Hubballi","Hubballi","IN",15.3617,75.0849),("IXJ","VIJU","Jammu","Jammu","IN",32.6891,74.8374),
 ("DXB","OMDB","Dubai International","Dubai","AE",25.2532,55.3657),("AUH","OMAA","Zayed International","Abu Dhabi","AE",24.4330,54.6511),
 ("DOH","OTHH","Hamad International","Doha","QA",25.2731,51.6081),("LHR","EGLL","Heathrow","London","GB",51.4700,-0.4543),
 ("ZRH","LSZH","Zurich","Zurich","CH",47.4647,8.5492),("FRA","EDDF","Frankfurt","Frankfurt","DE",50.0379,8.5622),
 ("CDG","LFPG","Charles de Gaulle","Paris","FR",49.0097,2.5479),("SIN","WSSS","Changi","Singapore","SG",1.3644,103.9915),
 ("BKK","VTBS","Suvarnabhumi","Bangkok","TH",13.6900,100.7501),("HKG","VHHH","Hong Kong International","Hong Kong","HK",22.3080,113.9185),
 ("KUL","WMKK","Kuala Lumpur International","Kuala Lumpur","MY",2.7456,101.7099),("JFK","KJFK","John F. Kennedy International","New York","US",40.6413,-73.7781),
 ("SFO","KSFO","San Francisco International","San Francisco","US",37.6213,-122.3790),("CMB","VCBI","Bandaranaike International","Colombo","LK",7.1808,79.8841),
 ("KTM","VNKT","Tribhuvan International","Kathmandu","NP",27.6966,85.3591),("DAC","VGHS","Hazrat Shahjalal International","Dhaka","BD",23.8433,90.3978),
]
# iata, icao, name, country, active
AIRLINES = [
 ("AI","AIC","Air India","IN",True),("6E","IGO","IndiGo","IN",True),("IX","AXB","Air India Express","IN",True),("SG","SEJ","SpiceJet","IN",True),
 ("QP","AKJ","Akasa Air","IN",True),("S5","SDG","Star Air","IN",True),("9I","LLR","Alliance Air","IN",True),("UK","VTI","Vistara (merged into Air India, Nov 2024)","IN",False),
 ("EK","UAE","Emirates","AE",True),("EY","ETD","Etihad Airways","AE",True),("QR","QTR","Qatar Airways","QA",True),("BA","BAW","British Airways","GB",True),
 ("LX","SWR","SWISS","CH",True),("LH","DLH","Lufthansa","DE",True),("AF","AFR","Air France","FR",True),("SQ","SIA","Singapore Airlines","SG",True),
 ("TG","THA","Thai Airways","TH",True),("CX","CPA","Cathay Pacific","HK",True),("UA","UAL","United Airlines","US",True),
]
# type, name, seats, typical cruise fuel burn kg/h, range km, cruise km/h
AIRCRAFT = [
 ("A320neo","Airbus A320neo",186,2250,6300,830),("A320","Airbus A320-200",180,2500,6100,830),("A321neo","Airbus A321neo",222,2550,7400,830),
 ("B737-800","Boeing 737-800",189,2600,5700,830),("B737-8","Boeing 737 MAX 8",189,2300,6500,830),("ATR72","ATR 72-600",72,650,1500,510),
 ("B787-8","Boeing 787-8 Dreamliner",256,5400,13600,900),("B787-9","Boeing 787-9 Dreamliner",296,5700,14100,900),("B777-300ER","Boeing 777-300ER",342,7500,13650,905),
 ("A350-900","Airbus A350-900",300,5900,15000,910),("A330-300","Airbus A330-300",290,5800,11750,870),("A380","Airbus A380-800",489,11000,15200,900),
]

def airport(iata): return next(a for a in AIRPORTS if a[0] == iata)
def distance_km(a, b):
    p1, p2 = math.radians(airport(a)[5]), math.radians(airport(b)[5]); dl = math.radians(airport(b)[6] - airport(a)[6]); dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(h))
def block_minutes(a, b, cruise_kmh=830):
    return int(round(distance_km(a, b) / cruise_kmh * 60 + 35, -1))   # +35 min taxi/climb/descent

# Real hub-and-spoke network: which airline operates which routes from each of our three airports, with typical aircraft.
NETWORK = {
 "DEL": [("AI","T3",["BOM","BLR","HYD","MAA","CCU","GOI","COK","PNQ","AMD","JAI","LKO","SXR","IXL"],["A320neo","A321neo","B737-8"]),
         ("6E","T1",["BOM","BLR","HYD","MAA","CCU","AMD","GOI","PNQ","JAI","PAT","GAU","IXC","VNS","IDR","BBI","NAG","RPR"],["A320neo","A321neo"]),
         ("IX","T3",["BLR","HYD","COK","TRV","IXE","CCU","PAT"],["B737-8"]),("QP","T1",["BOM","BLR","AMD","PNQ","GOI"],["B737-8"]),
         ("SG","T1",["BOM","HYD","GAU","JAI","PNQ","IDR"],["B737-800"]),("UK","T3",["BOM","BLR","HYD","CCU","PNQ"],["A320neo"]),
         ("AI","T3",["LHR","SFO","JFK","DXB","SIN","BKK","FRA"],["B787-8","B777-300ER","A350-900"]),("EK","T3",["DXB"],["B777-300ER","A380"]),
         ("LX","T3",["ZRH"],["A330-300"]),("QR","T3",["DOH"],["A350-900"]),("BA","T3",["LHR"],["B787-9"]),("SQ","T3",["SIN"],["A350-900"])],
 "BOM": [("AI","T2",["DEL","BLR","HYD","MAA","CCU","GOI","COK","JAI","LKO","AMD"],["A320neo","A321neo"]),("6E","T1",["DEL","BLR","HYD","MAA","CCU","GOI","COK","JAI","LKO","PNQ","AMD","IXE","NAG","IDR","BBI"],["A320neo","A321neo"]),
         ("IX","T1",["DXB","AUH","DOH","COK","TRV","IXE","HYD"],["B737-8"]),("QP","T1",["DEL","BLR","AMD","GOI","HYD"],["B737-8"]),
         ("AI","T2",["LHR","JFK","SFO","SIN","DXB","FRA"],["B787-8","B777-300ER","A350-900"]),("EK","T2",["DXB"],["A380","B777-300ER"]),
         ("LX","T2",["ZRH"],["A330-300"]),("QR","T2",["DOH"],["A350-900"]),("LH","T2",["FRA"],["A350-900"]),("AF","T2",["CDG"],["B787-9"])],
 "BLR": [("AI","T2",["DEL","BOM","HYD","MAA","CCU","PNQ","GOI","AMD"],["A320neo","A321neo"]),("6E","T1",["DEL","BOM","HYD","MAA","CCU","COK","GOI","PNQ","AMD","JAI","LKO","VTZ","CJB","IXM","IXE","TRV","BBI","PAT","GAU"],["A320neo","A321neo"]),
         ("IX","T1",["DXB","AUH","DOH","COK","TRV","IXE","CCU","HYD"],["B737-8"]),("QP","T1",["DEL","BOM","HYD","PNQ","AMD"],["B737-8"]),
         ("AI","T2",["LHR","SIN","SFO","FRA"],["B787-8","B777-300ER"]),("SQ","T2",["SIN"],["A350-900"]),("EK","T2",["DXB"],["B777-300ER"]),("LH","T2",["FRA"],["A350-900"]),("CX","T2",["HKG"],["A330-300"]),("TG","T2",["BKK"],["A320neo"])],
}
