

import { DEMO_LOGIN_ENABLED } from "../config";

/** Demo accounts. Empty in production builds (DEMO_LOGIN_ENABLED is a build-time constant, so the data is stripped from the bundle). */
export const MOCK_USERS: (any & { password: string; staffLevel?: string })[] = !DEMO_LOGIN_ENABLED ? [] : [
  {id:"u001",name:"Arjun Sharma",     email:"admin@del.aerobase.in",   password:"DEL@Admin2024",role:"airport_admin",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 09:00",verified:true},
  {id:"u002",name:"Priya Nair",       email:"admin@bom.aerobase.in",   password:"BOM@Admin2024",role:"airport_admin",airport:"BOM",airportName:"Mumbai Chhatrapati Shivaji",lastLogin:"2024-04-25 14:30",verified:true},
  {id:"u003",name:"Vikram Rao",       email:"admin@blr.aerobase.in",   password:"BLR@Admin2024",role:"airport_admin",airport:"BLR",airportName:"Bengaluru Kempegowda",lastLogin:"2024-04-24 11:00",verified:true},
  {id:"u004",name:"Sunita Patel",     email:"admin@hyd.aerobase.in",   password:"HYD@Admin2024",role:"airport_admin",airport:"HYD",airportName:"Hyderabad Rajiv Gandhi",lastLogin:"2024-04-23 08:45",verified:true},
  {id:"u005",name:"Rajesh Kumar",     email:"security@del.aerobase.in",password:"Sec@2024",     role:"staff",        airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:30",verified:true,staffLevel:"staff_security"},
  {id:"u006",name:"Rahul Kumar",      email:"staff@del.aerobase.in",   password:"Staff@2024",   role:"staff",        airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"staff_ops"},
  {id:"u007",name:"Meera Singh",      email:"cleaning@del.aerobase.in",password:"Clean@2024",   role:"staff",        airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 06:00",verified:true,staffLevel:"staff_cleaning"},
  {id:"u008",name:"Dr. Anita Roy",    email:"medical@del.aerobase.in", password:"Med@2024",     role:"staff",        airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 08:00",verified:true,staffLevel:"staff_medical"},
  // ── Additional Airline users ──
  {id:"u027",name:"Vistara Ops DEL",   email:"ops@vistara.aerobase.in",   password:"UK@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_UK"},
  {id:"u028",name:"SpiceJet Ops DEL",  email:"ops@spicejet.aerobase.in",   password:"SG@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_SG"},
  {id:"u029",name:"Akasa Ops DEL",     email:"ops@akasa.aerobase.in",       password:"QP@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_QP"},
  // ── Airline / Pilot users ──
  {id:"u020",name:"Capt. Arjun Sharma",email:"captain@airindia.aerobase.in",  password:"AI@Captain2024", role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 05:00",verified:true,staffLevel:"pilot_captain_AI"},
  {id:"u021",name:"Capt. Vikram Gupta", email:"captain@indigo.aerobase.in",   password:"6E@Captain2024", role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 06:00",verified:true,staffLevel:"pilot_captain_6E"},
  {id:"u022",name:"F/O Rahul Mehta",    email:"fo@airindia.aerobase.in",       password:"AI@FO2024",      role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 08:00",verified:true,staffLevel:"pilot_fo_AI"},
  {id:"u023",name:"Air India Ops DEL",  email:"ops@airindia.aerobase.in",      password:"AI@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_AI"},
  {id:"u024",name:"IndiGo Ops DEL",     email:"ops@indigo.aerobase.in",        password:"6E@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_6E"},
  {id:"u025",name:"Emirates Ops DEL",   email:"ops@emirates.aerobase.in",      password:"EK@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_EK"},
  {id:"u026",name:"SpiceJet Ops DEL",   email:"ops@spicejet.aerobase.in",      password:"SG@Ops2024",     role:"staff",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 07:00",verified:true,staffLevel:"airline_SG"},
  {id:"u011",name:"Starbucks Manager DEL",      email:"starbucks@del.aerobase.in",password:"Star@2024",  role:"retailer",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 08:00",verified:true,staffLevel:"retailer"},
  {id:"u012",name:"KFC Franchise Owner",          email:"kfc@del.aerobase.in",          password:"KFC@2024",   role:"retailer",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 09:00",verified:true,staffLevel:"retailer"},
  {id:"u010",name:"Rahul Sharma (Aqua Blue)",email:"retailer@del.aerobase.in",password:"Retail@2024",role:"retailer",airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 09:00",verified:true,staffLevel:"retailer"},
  {id:"u009",name:"Passenger User",   email:"passenger@aerobase.in",   password:"Pass@2024",    role:"passenger",    airport:"DEL",airportName:"Delhi Indira Gandhi Intl",lastLogin:"2024-04-26 06:00",verified:true},
];

export const AIRPORTS = [
  {code:"DEL",name:"Delhi Indira Gandhi International",         city:"New Delhi",    state:"Delhi",       terminals:3,gates:78},
  {code:"BOM",name:"Mumbai Chhatrapati Shivaji International",  city:"Mumbai",       state:"Maharashtra", terminals:2,gates:42},
  {code:"BLR",name:"Bengaluru Kempegowda International",        city:"Bengaluru",    state:"Karnataka",   terminals:2,gates:60},
  {code:"HYD",name:"Hyderabad Rajiv Gandhi International",      city:"Hyderabad",    state:"Telangana",   terminals:1,gates:34},
  {code:"CCU",name:"Kolkata Netaji Subhas International",       city:"Kolkata",      state:"West Bengal", terminals:2,gates:28},
  {code:"MAA",name:"Chennai International Airport",             city:"Chennai",      state:"Tamil Nadu",  terminals:4,gates:36},
  {code:"COK",name:"Kochi International Airport",               city:"Kochi",        state:"Kerala",      terminals:3,gates:22},
  {code:"AMD",name:"Ahmedabad Sardar Vallabhbhai Patel Intl",   city:"Ahmedabad",    state:"Gujarat",     terminals:2,gates:20},
  {code:"PNQ",name:"Pune International Airport",                city:"Pune",         state:"Maharashtra", terminals:1,gates:14},
  {code:"GAU",name:"Guwahati Lokpriya Gopinath Bordoloi Intl",  city:"Guwahati",     state:"Assam",       terminals:1,gates:12},
  {code:"JAI",name:"Jaipur International Airport",              city:"Jaipur",       state:"Rajasthan",   terminals:2,gates:16},
  {code:"IXC",name:"Chandigarh International Airport",          city:"Chandigarh",   state:"Punjab",      terminals:1,gates:10},
  {code:"LKO",name:"Lucknow Chaudhary Charan Singh Intl",       city:"Lucknow",      state:"UP",          terminals:1,gates:14},
  {code:"VNS",name:"Varanasi Lal Bahadur Shastri Intl",         city:"Varanasi",     state:"UP",          terminals:1,gates:8},
  {code:"PAT",name:"Patna Jay Prakash Narayan Intl",            city:"Patna",        state:"Bihar",       terminals:1,gates:8},
  {code:"BBI",name:"Bhubaneswar Biju Patnaik International",    city:"Bhubaneswar",  state:"Odisha",      terminals:1,gates:10},
  {code:"IXR",name:"Ranchi Birsa Munda International",          city:"Ranchi",       state:"Jharkhand",   terminals:1,gates:8},
  {code:"STV",name:"Surat International Airport",               city:"Surat",        state:"Gujarat",     terminals:1,gates:6},
  {code:"NAG",name:"Nagpur Dr. Babasaheb Ambedkar Intl",        city:"Nagpur",       state:"Maharashtra", terminals:1,gates:10},
  {code:"IDR",name:"Indore Devi Ahilyabai Holkar Airport",      city:"Indore",       state:"MP",          terminals:1,gates:8},
  {code:"GOI",name:"Goa Manohar International Airport",         city:"Goa",          state:"Goa",         terminals:1,gates:12},
  {code:"IXB",name:"Bagdogra Airport",                          city:"Siliguri",     state:"West Bengal", terminals:1,gates:6},
  {code:"TRV",name:"Thiruvananthapuram International Airport",  city:"Thiruvananthapuram",state:"Kerala", terminals:1,gates:10},
  {code:"IXZ",name:"Port Blair Veer Savarkar International",    city:"Port Blair",   state:"Andaman",     terminals:1,gates:6},
  {code:"SXR",name:"Srinagar International Airport",            city:"Srinagar",     state:"J&K",         terminals:1,gates:8},
  {code:"IXL",name:"Leh Kushok Bakula Rimpochhe Airport",       city:"Leh",          state:"Ladakh",      terminals:1,gates:4},
];

// Real Indian airline flights for demo
export const DEMO_FLIGHTS = [
  {flight_number:"AI-101",  origin:"DEL", destination:"BOM", gate:"A1",  status:"Boarding",   airline:"Air India",    dep:"10:30",arr:"12:40",aircraft:"Boeing 787",terminal:"T3"},
  {flight_number:"6E-2341", origin:"DEL", destination:"BLR", gate:"B3",  status:"Scheduled",  airline:"IndiGo",       dep:"11:00",arr:"13:15",aircraft:"A320neo",   terminal:"T2"},
  {flight_number:"UK-925",  origin:"DEL", destination:"HYD", gate:"C2",  status:"Delayed",    airline:"Vistara",      dep:"09:45",arr:"11:55",aircraft:"A320",      terminal:"T3"},
  {flight_number:"SG-3405", origin:"DEL", destination:"CCU", gate:"A4",  status:"Departed",   airline:"SpiceJet",     dep:"08:30",arr:"10:45",aircraft:"B737",      terminal:"T1"},
  {flight_number:"IX-611",  origin:"DEL", destination:"COK", gate:"D1",  status:"Scheduled",  airline:"Air India Express",     dep:"14:00",arr:"17:00",aircraft:"A320",      terminal:"T2"},
  {flight_number:"AI-2811", origin:"BOM", destination:"DEL", gate:"A2",  status:"Landed",     airline:"Air India",    dep:"07:00",arr:"09:05",aircraft:"A321",      terminal:"T3"},
  {flight_number:"6E-5317", origin:"BLR", destination:"DEL", gate:"B5",  status:"Boarding",   airline:"IndiGo",       dep:"12:30",arr:"14:45",aircraft:"A321XLR",  terminal:"T2"},
  {flight_number:"QP-1401", origin:"DEL", destination:"JAI", gate:"B1",  status:"Scheduled",  airline:"Akasa Air",    dep:"15:30",arr:"16:15",aircraft:"B737 MAX",  terminal:"T1"},
  {flight_number:"AI-819",  origin:"DEL", destination:"LHR", gate:"E1",  status:"Boarding",   airline:"Air India",    dep:"13:45",arr:"19:15",aircraft:"Boeing 777",terminal:"T3"},
  {flight_number:"EK-511",  origin:"DEL", destination:"DXB", gate:"E2",  status:"Scheduled",  airline:"Emirates",     dep:"16:00",arr:"18:30",aircraft:"A380",      terminal:"T3"},
  {flight_number:"SG-2801", origin:"DEL", destination:"MAA", gate:"C4",  status:"Scheduled",  airline:"SpiceJet",     dep:"17:00",arr:"19:30",aircraft:"B737",      terminal:"T1"},
  {flight_number:"UK-202",  origin:"DEL", destination:"GOI", gate:"B2",  status:"Scheduled",  airline:"Vistara",      dep:"18:30",arr:"20:15",aircraft:"A320",      terminal:"T2"},
];
