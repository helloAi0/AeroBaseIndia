#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <openssl/ec.h>
#include <openssl/rsa.h>
#include <openssl/bn.h>
#include <openssl/obj_mac.h>
#include <cstdlib>
#include <map>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"
#include "../services/AuditWriter.h"

using namespace drogon;

// Passkey (WebAuthn) biometric check-in. The fingerprint / face / PIN never leaves the passenger's device; the server stores a
// public key and verifies a signed challenge (ES256 or RS256, "none" attestation).
//   POST /api/biometric/register/options   -> challenge for navigator.credentials.create
//   POST /api/biometric/register/verify    -> store the public key
//   POST /api/biometric/assert/options     -> challenge + allowed credentials for navigator.credentials.get
//   POST /api/biometric/assert/verify      -> verify signature, record the check-in
//   GET  /api/biometric/credentials        -> this user's registered devices
//   DELETE /api/biometric/credentials/{id}
namespace wa {
using Bytes = std::string;

inline Bytes b64uDecode(const std::string& in) {
    static const std::string tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    Bytes out; int val = 0, bits = -8;
    for (unsigned char c : in) {
        if (c == '=') break;
        auto p = tbl.find(c); if (p == std::string::npos) throw std::runtime_error("bad base64url");
        val = (val << 6) + static_cast<int>(p); bits += 6;
        if (bits >= 0) { out.push_back(static_cast<char>((val >> bits) & 0xFF)); bits -= 8; }
    }
    return out;
}
inline std::string b64uEncode(const Bytes& in) {
    static const char* tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    std::string out; int val = 0, bits = -6;
    for (unsigned char c : in) { val = (val << 8) + c; bits += 8; while (bits >= 0) { out.push_back(tbl[(val >> bits) & 0x3F]); bits -= 6; } }
    if (bits > -6) out.push_back(tbl[((val << 8) >> (bits + 8)) & 0x3F]);
    return out;
}
inline Bytes sha256(const Bytes& d) { unsigned char h[32]; SHA256(reinterpret_cast<const unsigned char*>(d.data()), d.size(), h); return Bytes(reinterpret_cast<char*>(h), 32); }

// --- minimal CBOR reader (enough for attestationObject and COSE keys) ---
struct Cbor {
    enum T { UINT, NINT, BYTES, TEXT, ARR, MAP, OTHER } t = OTHER;
    long long i = 0; Bytes s; std::vector<Cbor> a; std::vector<std::pair<Cbor, Cbor>> m;
    const Cbor* get(long long k) const { for (auto& kv : m) if ((kv.first.t == UINT || kv.first.t == NINT) && kv.first.i == k) return &kv.second; return nullptr; }
    const Cbor* get(const std::string& k) const { for (auto& kv : m) if (kv.first.t == TEXT && kv.first.s == k) return &kv.second; return nullptr; }
};
inline Cbor parse(const Bytes& b, size_t& p, int depth = 0) {
    if (depth > 8 || p >= b.size()) throw std::runtime_error("cbor");
    unsigned char ib = static_cast<unsigned char>(b[p++]); int mt = ib >> 5; unsigned ai = ib & 0x1F;
    unsigned long long v = ai;
    if (ai >= 24) {
        int n = ai == 24 ? 1 : ai == 25 ? 2 : ai == 26 ? 4 : ai == 27 ? 8 : -1; if (n < 0 || p + n > b.size()) throw std::runtime_error("cbor");
        v = 0; for (int k = 0; k < n; k++) v = (v << 8) | static_cast<unsigned char>(b[p++]);
    }
    Cbor c;
    switch (mt) {
        case 0: c.t = Cbor::UINT; c.i = static_cast<long long>(v); break;
        case 1: c.t = Cbor::NINT; c.i = -1 - static_cast<long long>(v); break;
        case 2: case 3: if (v > b.size() - p) throw std::runtime_error("cbor"); c.t = mt == 2 ? Cbor::BYTES : Cbor::TEXT; c.s = b.substr(p, v); p += v; break;
        case 4: if (v > 64) throw std::runtime_error("cbor"); c.t = Cbor::ARR; for (unsigned long long k = 0; k < v; k++) c.a.push_back(parse(b, p, depth + 1)); break;
        case 5: if (v > 64) throw std::runtime_error("cbor"); c.t = Cbor::MAP; for (unsigned long long k = 0; k < v; k++) { auto key = parse(b, p, depth + 1); auto val = parse(b, p, depth + 1); c.m.emplace_back(key, val); } break;
        default: break;
    }
    return c;
}

// Verify `sig` over `msg` with a COSE public key (ES256 or RS256).
inline bool verifySig(const Bytes& coseBytes, const Bytes& msg, const Bytes& sig) {
    size_t p = 0; Cbor k = parse(coseBytes, p); const Cbor* alg = k.get(3LL); if (!alg) return false;
    EVP_PKEY* pkey = nullptr;
    if (alg->i == -7) {
        const Cbor* x = k.get(-2LL); const Cbor* y = k.get(-3LL); if (!x || !y || x->s.size() != 32 || y->s.size() != 32) return false;
        EC_KEY* ec = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1); if (!ec) return false;
        BIGNUM* bx = BN_bin2bn(reinterpret_cast<const unsigned char*>(x->s.data()), 32, nullptr);
        BIGNUM* by = BN_bin2bn(reinterpret_cast<const unsigned char*>(y->s.data()), 32, nullptr);
        bool ok = EC_KEY_set_public_key_affine_coordinates(ec, bx, by) == 1; BN_free(bx); BN_free(by);
        if (!ok) { EC_KEY_free(ec); return false; }
        pkey = EVP_PKEY_new(); if (!pkey || EVP_PKEY_assign_EC_KEY(pkey, ec) != 1) { EC_KEY_free(ec); EVP_PKEY_free(pkey); return false; }
    } else if (alg->i == -257) {
        const Cbor* n = k.get(-1LL); const Cbor* e = k.get(-2LL); if (!n || !e) return false;
        RSA* rsa = RSA_new(); if (!rsa) return false;
        BIGNUM* bn = BN_bin2bn(reinterpret_cast<const unsigned char*>(n->s.data()), static_cast<int>(n->s.size()), nullptr);
        BIGNUM* be = BN_bin2bn(reinterpret_cast<const unsigned char*>(e->s.data()), static_cast<int>(e->s.size()), nullptr);
        if (RSA_set0_key(rsa, bn, be, nullptr) != 1) { BN_free(bn); BN_free(be); RSA_free(rsa); return false; }
        pkey = EVP_PKEY_new(); if (!pkey || EVP_PKEY_assign_RSA(pkey, rsa) != 1) { RSA_free(rsa); EVP_PKEY_free(pkey); return false; }
    } else return false;
    EVP_MD_CTX* ctx = EVP_MD_CTX_new(); bool good = false;
    if (ctx && EVP_DigestVerifyInit(ctx, nullptr, EVP_sha256(), nullptr, pkey) == 1 &&
        EVP_DigestVerify(ctx, reinterpret_cast<const unsigned char*>(sig.data()), sig.size(), reinterpret_cast<const unsigned char*>(msg.data()), msg.size()) == 1) good = true;
    EVP_MD_CTX_free(ctx); EVP_PKEY_free(pkey); return good;
}
}  // namespace wa

class WebAuthnController : public HttpController<WebAuthnController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(WebAuthnController::regOptions, "/api/biometric/register/options", Post);
        ADD_METHOD_TO(WebAuthnController::regVerify, "/api/biometric/register/verify", Post);
        ADD_METHOD_TO(WebAuthnController::asOptions, "/api/biometric/assert/options", Post);
        ADD_METHOD_TO(WebAuthnController::asVerify, "/api/biometric/assert/verify", Post);
        ADD_METHOD_TO(WebAuthnController::list, "/api/biometric/credentials", Get);
        ADD_METHOD_TO(WebAuthnController::remove, "/api/biometric/credentials/{1}", Delete);
    METHOD_LIST_END

    struct Who { std::string uid, tenant, name, email; };
    using CB = std::function<void(const HttpResponsePtr&)>;
    static void reply(const CB& cb, const Json::Value& v, HttpStatusCode c = k200OK) { auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r); }
    static void fail(const CB& cb, const char* m, HttpStatusCode c) { Json::Value e; e["error"] = m; reply(cb, e, c); }
    static Who who(const HttpRequestPtr& req) {
        auto d = JwtService::verifyToken(req->getHeader("Authorization").substr(7)); Who w;
        w.uid = d.get_payload_claim("user_id").as_string(); w.tenant = d.get_payload_claim("tenant_id").as_string();
        try { w.name = d.get_payload_claim("name").as_string(); } catch (...) {}
        try { w.email = d.get_payload_claim("email").as_string(); } catch (...) {}
        return w;
    }
    // The page origin the browser used; WEBAUTHN_ORIGINS (comma list) pins it in production.
    static bool originOk(const std::string& origin) {
        if (origin.empty()) return false;
        if (const char* env = std::getenv("WEBAUTHN_ORIGINS"); env && *env) {
            std::string list = env, item; size_t s = 0;
            while (s <= list.size()) { size_t e = list.find(',', s); if (e == std::string::npos) e = list.size(); item = list.substr(s, e - s); if (item == origin) return true; s = e + 1; }
            return false;
        }
        return true;
    }
    static std::string rpIdOf(const std::string& origin) {
        size_t p = origin.find("://"); std::string h = p == std::string::npos ? origin : origin.substr(p + 3);
        size_t c = h.find(':'); if (c != std::string::npos) h = h.substr(0, c); return h;
    }
    static std::string newChallenge(pqxx::work& t, const std::string& uid, const char* purpose) {
        unsigned char r[32]; RAND_bytes(r, 32); std::string ch = wa::b64uEncode(std::string(reinterpret_cast<char*>(r), 32));
        t.exec("DELETE FROM webauthn_challenges WHERE expires_at < now()");
        t.exec_params("INSERT INTO webauthn_challenges (challenge, user_id, purpose, expires_at) VALUES ($1, $2::uuid, $3, now() + interval '5 minutes')", ch, uid, purpose);
        return ch;
    }
    static bool takeChallenge(pqxx::work& t, const std::string& ch, const std::string& uid, const char* purpose) {
        auto r = t.exec_params("DELETE FROM webauthn_challenges WHERE challenge=$1 AND user_id=$2::uuid AND purpose=$3 AND expires_at > now() RETURNING 1", ch, uid, purpose);
        return !r.empty();
    }
    // Parse + check clientDataJSON; returns the raw bytes for hashing.
    static bool checkClient(const std::string& cdB64, const char* type, std::string& challenge, std::string& origin, std::string& raw) {
        raw = wa::b64uDecode(cdB64); Json::Value j; Json::CharReaderBuilder b; std::string err; std::unique_ptr<Json::CharReader> rd(b.newCharReader());
        if (!rd->parse(raw.data(), raw.data() + raw.size(), &j, &err)) return false;
        if (j["type"].asString() != type) return false;
        challenge = j["challenge"].asString(); origin = j["origin"].asString();
        return !challenge.empty() && originOk(origin);
    }

    void regOptions(const HttpRequestPtr& req, CB&& cb) {
        try {
            Who w = who(req); auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            std::string ch = newChallenge(t, w.uid, "reg");
            auto ex = t.exec_params("SELECT credential_id FROM webauthn_credentials WHERE user_id=$1::uuid", w.uid); t.commit();
            Json::Value o; o["challenge"] = ch; o["user"]["id"] = wa::b64uEncode(w.uid); o["user"]["name"] = w.email.empty() ? w.uid : w.email; o["user"]["displayName"] = w.name.empty() ? "AeroBase user" : w.name;
            o["rp"]["name"] = "AeroBase India"; o["timeout"] = 60000;
            Json::Value ex2(Json::arrayValue); for (const auto& r : ex) ex2.append(r[0].c_str()); o["excludeCredentials"] = ex2;
            reply(cb, o);
        } catch (const std::exception&) { fail(cb, "Internal server error", k500InternalServerError); }
    }

    void regVerify(const HttpRequestPtr& req, CB&& cb) {
        try {
            Who w = who(req); auto j = req->getJsonObject(); if (!j) return fail(cb, "JSON body required", k400BadRequest);
            std::string chal, origin, raw;
            if (!checkClient((*j)["clientDataJSON"].asString(), "webauthn.create", chal, origin, raw)) return fail(cb, "Invalid client data", k400BadRequest);
            if (req->getHeader("Origin") != "" && req->getHeader("Origin") != origin) return fail(cb, "Origin mismatch", k400BadRequest);
            wa::Bytes att = wa::b64uDecode((*j)["attestationObject"].asString()); size_t p = 0; auto root = wa::parse(att, p);
            const auto* ad = root.get(std::string("authData")); if (!ad || ad->s.size() < 55) return fail(cb, "Invalid attestation", k400BadRequest);
            const wa::Bytes& a = ad->s;
            if (a.substr(0, 32) != wa::sha256(rpIdOf(origin))) return fail(cb, "RP ID mismatch", k400BadRequest);
            if (!(static_cast<unsigned char>(a[32]) & 0x40)) return fail(cb, "No credential data", k400BadRequest);
            if (!(static_cast<unsigned char>(a[32]) & 0x01)) return fail(cb, "User presence required", k400BadRequest);
            size_t idLen = (static_cast<unsigned char>(a[53]) << 8) | static_cast<unsigned char>(a[54]); if (55 + idLen > a.size()) return fail(cb, "Invalid attestation", k400BadRequest);
            wa::Bytes credId = a.substr(55, idLen); size_t kp = 55 + idLen; size_t kstart = kp; (void)wa::parse(a, kp); wa::Bytes cose = a.substr(kstart, kp - kstart);
            { size_t q = 0; auto k = wa::parse(cose, q); const auto* alg = k.get(3LL); if (!alg || (alg->i != -7 && alg->i != -257)) return fail(cb, "Unsupported key type", k400BadRequest); }
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            if (!takeChallenge(t, chal, w.uid, "reg")) return fail(cb, "Challenge expired or already used", k400BadRequest);
            std::string label = (*j)["label"].asString(); if (label.empty() || label.size() > 60) label = "This device";
            auto r = t.exec_params("INSERT INTO webauthn_credentials (tenant_id, user_id, credential_id, cose_key, label) VALUES ($1::uuid, $2::uuid, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING id::text",
                                   w.tenant, w.uid, wa::b64uEncode(credId), wa::b64uEncode(cose), label);
            t.commit();
            if (r.empty()) return fail(cb, "This device is already registered", k409Conflict);
            Json::Value d; d["label"] = label; AuditWriter::record(w.tenant, w.uid, "PASSKEY_REGISTERED", "webauthn", d, req->peerAddr().toIp());
            Json::Value o; o["ok"] = true; o["id"] = r[0][0].c_str(); reply(cb, o, k201Created);
        } catch (const std::exception&) { fail(cb, "Invalid registration data", k400BadRequest); }
    }

    void asOptions(const HttpRequestPtr& req, CB&& cb) {
        try {
            Who w = who(req); auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto cr = t.exec_params("SELECT credential_id FROM webauthn_credentials WHERE user_id=$1::uuid", w.uid);
            if (cr.empty()) return fail(cb, "No device registered yet. Register this device first.", k404NotFound);
            std::string ch = newChallenge(t, w.uid, "get"); t.commit();
            Json::Value o; o["challenge"] = ch; o["timeout"] = 60000; Json::Value ids(Json::arrayValue); for (const auto& r : cr) ids.append(r[0].c_str()); o["allowCredentials"] = ids;
            reply(cb, o);
        } catch (const std::exception&) { fail(cb, "Internal server error", k500InternalServerError); }
    }

    void asVerify(const HttpRequestPtr& req, CB&& cb) {
        try {
            Who w = who(req); auto j = req->getJsonObject(); if (!j) return fail(cb, "JSON body required", k400BadRequest);
            std::string chal, origin, raw;
            if (!checkClient((*j)["clientDataJSON"].asString(), "webauthn.get", chal, origin, raw)) return fail(cb, "Invalid client data", k400BadRequest);
            if (req->getHeader("Origin") != "" && req->getHeader("Origin") != origin) return fail(cb, "Origin mismatch", k400BadRequest);
            wa::Bytes ad = wa::b64uDecode((*j)["authenticatorData"].asString()), sig = wa::b64uDecode((*j)["signature"].asString());
            if (ad.size() < 37) return fail(cb, "Invalid authenticator data", k400BadRequest);
            if (ad.substr(0, 32) != wa::sha256(rpIdOf(origin))) return fail(cb, "RP ID mismatch", k400BadRequest);
            if (!(static_cast<unsigned char>(ad[32]) & 0x01)) return fail(cb, "User presence required", k400BadRequest);
            if (!(static_cast<unsigned char>(ad[32]) & 0x04)) return fail(cb, "Device verification (fingerprint, face or PIN) required", k400BadRequest);
            unsigned long counter = (static_cast<unsigned char>(ad[33]) << 24) | (static_cast<unsigned char>(ad[34]) << 16) | (static_cast<unsigned char>(ad[35]) << 8) | static_cast<unsigned char>(ad[36]);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto cr = t.exec_params("SELECT cose_key, sign_count FROM webauthn_credentials WHERE credential_id=$1 AND user_id=$2::uuid", (*j)["credentialId"].asString(), w.uid);
            if (cr.empty()) return fail(cb, "Unknown device", k404NotFound);
            if (!takeChallenge(t, chal, w.uid, "get")) return fail(cb, "Challenge expired or already used", k400BadRequest);
            wa::Bytes signed_ = ad + wa::sha256(raw);
            if (!wa::verifySig(wa::b64uDecode(cr[0][0].c_str()), signed_, sig)) { t.commit(); AuditWriter::record(w.tenant, w.uid, "PASSKEY_FAILED", "webauthn", Json::Value(), req->peerAddr().toIp()); return fail(cb, "Verification failed", k401Unauthorized); }
            long long stored = cr[0][1].as<long long>();
            if ((counter != 0 || stored != 0) && static_cast<long long>(counter) <= stored) return fail(cb, "Replay detected", k401Unauthorized);
            t.exec_params("UPDATE webauthn_credentials SET sign_count=$1, last_used_at=now() WHERE credential_id=$2", static_cast<long long>(counter), (*j)["credentialId"].asString());
            Json::Value rec; rec["passenger"] = w.name.empty() ? w.email : w.name; rec["flight"] = (*j)["flight"].asString().substr(0, 12); rec["seat"] = (*j)["seat"].asString().substr(0, 6);
            rec["bags"] = 0; rec["status"] = "Checked in"; rec["method"] = "Passkey (device biometric)";
            std::string pnr = (*j)["pnr"].asString().substr(0, 10); if (!pnr.empty()) rec["pnr"] = pnr;
            Json::StreamWriterBuilder sw; sw["indentation"] = "";
            auto ins = t.exec_params("INSERT INTO app_records (tenant_id, collection, data, created_by) VALUES ($1::uuid, 'checkins', $2::jsonb, $3::uuid) RETURNING id::text", w.tenant, Json::writeString(sw, rec), w.uid);
            t.commit();
            Json::Value d; d["flight"] = rec["flight"]; AuditWriter::record(w.tenant, w.uid, "BIOMETRIC_CHECKIN", "checkin", d, req->peerAddr().toIp());
            Json::Value o; o["verified"] = true; o["record_id"] = ins[0][0].c_str(); reply(cb, o);
        } catch (const std::exception&) { fail(cb, "Invalid assertion data", k400BadRequest); }
    }

    void list(const HttpRequestPtr& req, CB&& cb) {
        try {
            Who w = who(req); auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec_params("SELECT id::text, label, to_char(created_at,'YYYY-MM-DD HH24:MI'), COALESCE(to_char(last_used_at,'YYYY-MM-DD HH24:MI'),'') FROM webauthn_credentials WHERE user_id=$1::uuid ORDER BY created_at", w.uid);
            Json::Value arr(Json::arrayValue); for (const auto& r : rows) { Json::Value o; o["id"] = r[0].c_str(); o["label"] = r[1].c_str(); o["created_at"] = r[2].c_str(); o["last_used_at"] = r[3].c_str(); arr.append(o); }
            Json::Value out; out["credentials"] = arr; reply(cb, out);
        } catch (const std::exception&) { fail(cb, "Internal server error", k500InternalServerError); }
    }

    void remove(const HttpRequestPtr& req, CB&& cb, std::string id) {
        try {
            Who w = who(req); auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("DELETE FROM webauthn_credentials WHERE id=$1::uuid AND user_id=$2::uuid RETURNING 1", id, w.uid); t.commit();
            if (r.empty()) return fail(cb, "Not found", k404NotFound);
            Json::Value o; o["ok"] = true; reply(cb, o);
        } catch (const std::exception&) { fail(cb, "Not found", k404NotFound); }
    }
};
