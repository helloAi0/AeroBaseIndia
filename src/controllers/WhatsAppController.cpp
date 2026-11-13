#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <openssl/hmac.h>
#include <openssl/crypto.h>
#include <regex>
#include <sstream>
#include <iomanip>
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

using namespace drogon;

// WhatsApp Cloud API (Meta) chatbot: flight status / gate / delays answered from the airport's real flight table.
//   GET  /webhooks/whatsapp  - Meta verification handshake (WHATSAPP_VERIFY_TOKEN)
//   POST /webhooks/whatsapp  - inbound messages, authenticated by X-Hub-Signature-256 (WHATSAPP_APP_SECRET)
// Replies are sent with WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID. Airport served: WHATSAPP_AIRPORT_CODE (default DEL).
namespace {
std::string env(const char* k, const std::string& d = "") { const char* v = std::getenv(k); return (v && *v) ? v : d; }
std::string hex(const unsigned char* d, unsigned n) { std::ostringstream s; for (unsigned i = 0; i < n; i++) s << std::hex << std::setw(2) << std::setfill('0') << (int)d[i]; return s.str(); }
std::string lower(std::string s) { for (auto& c : s) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c))); return s; }

bool signatureOk(const std::string& body, const std::string& header) {
    const std::string secret = env("WHATSAPP_APP_SECRET");
    if (secret.empty() || header.rfind("sha256=", 0) != 0) return false;
    unsigned char dg[EVP_MAX_MD_SIZE]; unsigned len = 0;
    HMAC(EVP_sha256(), secret.data(), (int)secret.size(), reinterpret_cast<const unsigned char*>(body.data()), body.size(), dg, &len);
    const std::string expected = hex(dg, len), got = header.substr(7);
    return expected.size() == got.size() && CRYPTO_memcmp(expected.data(), got.data(), got.size()) == 0;
}

struct Row { std::string flight, from, to, dep, gate, status; int delay = 0; };

std::vector<Row> loadFlights(const std::string& airport) {
    std::vector<Row> out;
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    auto rows = t.exec_params(
        "SELECT f.flight_number, f.origin, f.destination, to_char(f.departure_time,'HH24:MI'), COALESCE(f.gate,''), f.status, COALESCE(f.delay_minutes,0) "
        "FROM flights f JOIN tenants t ON t.id=f.tenant_id WHERE t.airport_code=$1 AND f.departure_time >= CURRENT_DATE AND f.departure_time < CURRENT_DATE + interval '1 day' "
        "ORDER BY f.departure_time", airport);
    for (const auto& r : rows) out.push_back({r[0].c_str(), r[1].c_str(), r[2].c_str(), r[3].c_str(), r[4].c_str(), r[5].c_str(), r[6].as<int>()});
    return out;
}
// IATA codes whose airport city matches the text ("mumbai" -> BOM)
std::vector<std::string> codesForPlace(const std::string& place) {
    std::vector<std::string> codes; std::string p = place;
    while (!p.empty() && p.back() == ' ') p.pop_back();
    if (p.size() < 2 || p.size() > 40) return codes;
    if (p.size() == 3) { std::string u = p; for (auto& c : u) c = static_cast<char>(std::toupper(c)); codes.push_back(u); }
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    auto rows = t.exec_params("SELECT iata FROM reference_airports WHERE lower(city)=$1 OR lower(name) LIKE '%' || $1 || '%' LIMIT 5", p);
    for (const auto& r : rows) codes.push_back(r[0].c_str());
    return codes;
}
std::string line(const Row& f) { return "• " + f.flight + " " + f.from + "→" + f.to + " — " + f.status + ", Gate " + (f.gate.empty() ? "TBA" : f.gate) + ", " + f.dep; }
std::string list(const std::vector<const Row*>& v, const std::string& empty) {
    if (v.empty()) return empty;
    std::string s; for (size_t i = 0; i < v.size() && i < 5; i++) s += (i ? "\n" : "") + line(*v[i]);
    if (v.size() > 5) s += "\n…and " + std::to_string(v.size() - 5) + " more";
    return s;
}
}  // namespace

std::string whatsappReply(const std::string& text, const std::vector<Row>& flights, std::function<std::vector<std::string>(const std::string&)> places) {
    const std::string t = lower(text);
    static const std::regex menu(R"(^\s*(hi|hello|hey|help|menu|start)\b.*)"), blank(R"(^\s*$)");
    if (std::regex_match(t, blank) || std::regex_match(t, menu))
        return "✈ *AeroBase Assistant*\nTry:\n• status 6E-202\n• gate AI-101\n• delayed flights\n• flights to Mumbai\n• baggage 6E-202";
    std::string num; std::smatch m; static const std::regex fn(R"(\b([a-z0-9]{2})[ -]?(\d{2,4})\b)");
    if (std::regex_search(t, m, fn) && std::regex_search(m[1].str(), std::regex("[a-z]"))) { num = m[1].str() + "-" + m[2].str(); for (auto& c : num) c = static_cast<char>(std::toupper(c)); }
    const Row* byNum = nullptr; if (!num.empty()) for (const auto& f : flights) if (f.flight == num) { byNum = &f; break; }
    if (t.find("baggage") != std::string::npos || t.find("luggage") != std::string::npos || std::regex_search(t, std::regex(R"(\b(bag|carousel)\b)")))
        return byNum ? "🧳 Baggage for " + byNum->flight + ": belt allocation is announced about 10 minutes after landing. Status now: " + byNum->status + "." : "Which flight? e.g. “baggage 6E-202”.";
    if (t.find("gate") != std::string::npos && byNum) return "🚪 " + byNum->flight + " departs from Gate " + (byNum->gate.empty() ? "TBA" : byNum->gate) + ".";
    if (byNum) return "✈ " + byNum->flight + " " + byNum->from + " → " + byNum->to + "\nStatus: *" + byNum->status + "*\nGate: " + (byNum->gate.empty() ? "TBA" : byNum->gate) + " · departs " + byNum->dep + (byNum->delay > 0 ? "\nDelay: " + std::to_string(byNum->delay) + " min" : "");
    if (!num.empty()) return "I couldn’t find flight " + num + " today. Check the number and try again.";
    std::vector<const Row*> hits;
    if (t.find("delay") != std::string::npos) { for (const auto& f : flights) if (f.status == "Delayed") hits.push_back(&f); return list(hits, "No delayed flights right now."); }
    if (t.find("cancel") != std::string::npos) { for (const auto& f : flights) if (f.status == "Cancelled") hits.push_back(&f); return list(hits, "No cancelled flights right now."); }
    static const std::regex to(R"(\bto\s+([a-z ]{2,40}))");
    if (std::regex_search(t, m, to)) {
        auto codes = places(m[1].str());
        for (const auto& f : flights) { std::string d = f.to; for (auto& c : d) c = static_cast<char>(std::toupper(c)); for (const auto& c : codes) if (c == d) { hits.push_back(&f); break; } }
        return list(hits, "No flights to that destination today.");
    }
    return "No matching flights. Try “delayed flights” or “flights to Mumbai”.";
}

class WhatsAppController : public HttpController<WhatsAppController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(WhatsAppController::verify, "/webhooks/whatsapp", Get);
        ADD_METHOD_TO(WhatsAppController::receive, "/webhooks/whatsapp", Post);
    METHOD_LIST_END

    static HttpResponsePtr status(HttpStatusCode c, const char* body = "") { auto r = HttpResponse::newHttpResponse(); r->setStatusCode(c); r->setBody(body); return r; }

    void verify(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        const std::string token = env("WHATSAPP_VERIFY_TOKEN");
        if (token.empty()) return cb(status(k503ServiceUnavailable, "WhatsApp is not configured"));
        const std::string got = req->getParameter("hub.verify_token");
        if (req->getParameter("hub.mode") == "subscribe" && got.size() == token.size() && CRYPTO_memcmp(got.data(), token.data(), token.size()) == 0) {
            auto r = status(k200OK, req->getParameter("hub.challenge").c_str()); r->setContentTypeCode(CT_TEXT_PLAIN); return cb(r);
        }
        cb(status(k403Forbidden, "Forbidden"));
    }

    void receive(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        if (env("WHATSAPP_APP_SECRET").empty() || env("WHATSAPP_TOKEN").empty() || env("WHATSAPP_PHONE_NUMBER_ID").empty()) return cb(status(k503ServiceUnavailable, "WhatsApp is not configured"));
        const std::string body(req->body());
        if (!signatureOk(body, req->getHeader("X-Hub-Signature-256"))) return cb(status(k403Forbidden, "Forbidden"));
        Json::Value j; Json::CharReaderBuilder rb; std::string err; std::unique_ptr<Json::CharReader> rd(rb.newCharReader());
        if (!rd->parse(body.data(), body.data() + body.size(), &j, &err)) return cb(status(k400BadRequest, "Bad JSON"));
        cb(status(k200OK, "ok"));   // acknowledge first; Meta retries on slow/non-200 answers

        try {
            std::vector<Row> flights = loadFlights(env("WHATSAPP_AIRPORT_CODE", "DEL"));
            int handled = 0;
            for (const auto& entry : j["entry"]) for (const auto& ch : entry["changes"]) for (const auto& msg : ch["value"]["messages"]) {
                if (msg.get("type", "").asString() != "text" || ++handled > 5) continue;
                const std::string to = msg.get("from", "").asString();
                static const std::regex digits("^[0-9]{6,20}$"); if (!std::regex_match(to, digits)) continue;
                std::string text = msg["text"].get("body", "").asString(); if (text.size() > 300) text.resize(300);
                const std::string reply = whatsappReply(text, flights, codesForPlace);

                Json::Value out; out["messaging_product"] = "whatsapp"; out["to"] = to; out["type"] = "text"; out["text"]["body"] = reply;
                Json::StreamWriterBuilder w; w["indentation"] = ""; w["emitUTF8"] = true;
                auto client = HttpClient::newHttpClient(env("WHATSAPP_API_BASE", "https://graph.facebook.com/v20.0"));
                auto r = HttpRequest::newHttpRequest(); r->setMethod(Post);
                r->setPath("/" + env("WHATSAPP_PHONE_NUMBER_ID") + "/messages"); r->setContentTypeString("application/json"); r->setBody(Json::writeString(w, out));
                r->addHeader("Authorization", "Bearer " + env("WHATSAPP_TOKEN"));
                client->sendRequest(r, [client](ReqResult res, const HttpResponsePtr& resp) {
                    if (res != ReqResult::Ok || !resp || resp->statusCode() >= 300) core::Logger::warn("[WhatsApp] reply failed");
                }, 8.0);
            }
        } catch (const std::exception& e) { core::Logger::error(std::string("[WhatsApp] ") + e.what()); }
    }
};
