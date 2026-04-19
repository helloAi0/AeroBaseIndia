#pragma once
#include "../repositories/TicketRepository.h"
#include "AuthService.h"

class BookingService {
public:
    static Ticket createBooking(const std::string& tenantId,
                                const std::string& passengerId,
                                const std::string& flightId,
                                const std::string& seat,
                                double price) {
        Ticket t;
        t.id = AuthService::generateUUID();
        t.tenantId = tenantId;
        t.passengerId = passengerId;
        t.flightId = flightId;
        t.seatNumber = seat;
        t.bookingStatus = "Confirmed";
        t.ticketPrice = price;
        return t;
    }
};