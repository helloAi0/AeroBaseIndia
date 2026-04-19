#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Ticket.h"

class TicketRepository {
public:
    static void createTicket(const Ticket& t) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO tickets(id, tenant_id, passenger_id, flight_id, seat_number, booking_status, ticket_price) "
            "VALUES($1,$2,$3,$4,$5,$6,$7)",
            t.id,
            t.tenantId,
            t.passengerId,
            t.flightId,
            t.seatNumber,
            t.bookingStatus,
            t.ticketPrice
        );

        txn.commit();
    }
};