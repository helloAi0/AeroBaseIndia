#pragma once
#include <functional>
#include <string>

struct TgResult { std::string chat; bool ok = false; std::string error; };

/** Free, no-billing alerts via a Telegram bot. Env: TELEGRAM_BOT_TOKEN (from @BotFather), TELEGRAM_API_BASE (tests). */
class TelegramService {
public:
    static bool configured();
    static bool isValidChatId(const std::string& c);   // numeric id (may be negative for groups) or @channelname
    static void send(const std::string& chat, const std::string& text, std::function<void(TgResult)>&& done);
};
