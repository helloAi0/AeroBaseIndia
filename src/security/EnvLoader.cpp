#include "security/EnvLoader.h"
#include <fstream>
#include <cstdlib>

namespace security {

static std::unordered_map<std::string,std::string> envMap;

bool EnvLoader::load(const std::string& path) {
    std::ifstream file(path);
    if(!file.is_open()) return false;

    std::string line;
    while(std::getline(file,line)) {
        auto pos=line.find('=');
        if(pos==std::string::npos) continue;

        std::string key=line.substr(0,pos);
        std::string val=line.substr(pos+1);

        envMap[key]=val;
        setenv(key.c_str(), val.c_str(), 1);
    }
    return true;
}

std::string EnvLoader::get(const std::string& key,
                           const std::string& fallback) {
    const char* val = getenv(key.c_str());
    if(val) return std::string(val);

    auto it = envMap.find(key);
    if(it!=envMap.end()) return it->second;

    return fallback;
}

}
