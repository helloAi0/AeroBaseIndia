#pragma once

#include <string>
#include <json/json.h>

class ComplianceExportService {
public:
    static Json::Value exportLogs(const std::string& tenantId,
                                  const std::string& from,
                                  const std::string& to);

    static std::string generateDGCA_CSV(const std::string& tenantId);
    static void        maskSensitiveData(std::string& data);
};
