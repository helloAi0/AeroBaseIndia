#include <drogon/drogon.h>
#include <iostream>
#include "services/AuthService.h"

int main() {
    // --- PHASE 1: BOOTSTRAPPING (Database Seeding) ---
    try {
        std::cout << "[BOOTSTRAP] Attempting to register initial airport (DEL)...\n";
        
        AuthService::registerAirport(
            "Delhi International Airport",
            "DEL",
            "Admin User",
            "admin@delhi.com",
            "SecurePass123"
        );
        
        std::cout << "[BOOTSTRAP] Airport registered successfully!\n";
    } 
    catch (const pqxx::unique_violation& e) {
        // This prevents the "Aborted (core dumped)" error you saw.
        // It simply skips registration if the data already exists.
        std::cout << "[BOOTSTRAP] Info: Airport 'DEL' already exists. Skipping registration.\n";
    } 
    catch (const std::exception& e) {
        std::cerr << "[BOOTSTRAP] Critical Error: " << e.what() << "\n";
        return 1; // Exit if it's a real database failure (like wrong password)
    }

    // --- PHASE 2: SERVING (Start the API) ---
    std::cout << "[SERVER] Starting AeroBaseIndia on http://localhost:8080\n";
    
    drogon::app()
        .addListener("0.0.0.0", 8080)
        .setThreadNum(4)
        .run();

    return 0;
}