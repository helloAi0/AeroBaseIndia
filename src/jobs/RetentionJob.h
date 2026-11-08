#pragma once

class RetentionJob {
public:
    // Starts the background timer when the server boots
    static void startNightlyCleanup();
};