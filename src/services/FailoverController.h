#pragma once

class FailoverController {
public:
    // Initiates the promotion of a read-replica to master
    static void promoteStandbyToMaster();
    
    // Background loop that monitors the primary
    static void startWatchdog();
};