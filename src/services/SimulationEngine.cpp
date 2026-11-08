#include "SimulationEngine.h"
#include "DigitalTwinService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <pqxx/pqxx>

CascadeReport SimulationEngine::predictCascadingFailures(
    const std::string& rootFlightId,
    int                initialDelayMins)
{
    CascadeReport report;
    report.triggerId             = rootFlightId;
    report.totalSystemDelayAdded = initialDelayMins;

    std::unordered_set<std::string> visited;
    simulateImpact(rootFlightId, initialDelayMins, 0, visited, report);
    return report;
}

void SimulationEngine::simulateImpact(
    const std::string&              flightId,
    int                             delayMins,
    int                             depth,
    std::unordered_set<std::string>& visited,
    CascadeReport&                  report)
{
    if (depth >= MAX_CASCADE_DEPTH) return;
    if (visited.count(flightId))   return;
    visited.insert(flightId);

    report.impactedFlights.push_back(flightId);
    report.totalSystemDelayAdded += delayMins / 2;

    // Find empty gate from digital twin
    auto state = DigitalTwinService::getState();
    std::string emptyGate;
    for (const auto& [gate, status] : state.gates) {
        if (status == "OPEN") { emptyGate = gate; break; }
    }
    if (!emptyGate.empty()) {
        report.recommendedGateChanges.push_back(flightId + " -> " + emptyGate);
        report.affectedGates++;
    }

    // Recurse into connected flights via DB
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id FROM flights WHERE gate = "
            "(SELECT gate FROM flights WHERE id=$1) AND id != $1",
            flightId);
        for (const auto& row : r)
            simulateImpact(row[0].c_str(), delayMins/2, depth+1, visited, report);
    } catch (...) {}
}
