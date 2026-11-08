#pragma once
#include <string>

class MLDatasetExporter {
public:
    /**
     * Exports flight metrics to a CSV file for Machine Learning.
     * Returns true if successful, false otherwise.
     */
    static bool exportTrainingData(const std::string& filepath);
};