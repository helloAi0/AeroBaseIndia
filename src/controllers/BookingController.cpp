#include <drogon/drogon.h>
#include "../middleware/AuthMiddleware.h"
#include "../services/BookingService.h"

using namespace drogon;

class BookingController : public HttpController<BookingController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(BookingController::bookTicket, "/tickets", Post);
    METHOD_LIST_END

    void bookTicket(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& callback) {
        std::string tenantId;

        if (!AuthMiddleware::validate(req, tenantId)) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        auto json = req->getJsonObject();

        Ticket ticket = BookingService::createBooking(
            tenantId,
            (*json)["passenger_id"].asString(),
            (*json)["flight_id"].asString(),
            (*json)["seat_number"].asString(),
            (*json)["ticket_price"].asDouble()
        );

        TicketRepository::createTicket(ticket);

        Json::Value response;
        response["message"] = "Ticket booked successfully";

        callback(HttpResponse::newHttpJsonResponse(response));
    }
};