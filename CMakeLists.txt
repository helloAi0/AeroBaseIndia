cmake_minimum_required(VERSION 3.16)
project(AeroBaseIndia VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 1. Find Packages
find_package(Drogon REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(PostgreSQL REQUIRED)
find_package(PkgConfig REQUIRED)

# Use PkgConfig to find libpqxx and hiredis
pkg_check_modules(PQXX REQUIRED libpqxx)
pkg_check_modules(HIREDIS REQUIRED hiredis)

# 2. Project Structure & Include Paths
include_directories(
    include 
    ${PQXX_INCLUDE_DIRS} 
    ${PostgreSQL_INCLUDE_DIRS}
    ${HIREDIS_INCLUDE_DIRS}  # Added hiredis include path
    ${CMAKE_CURRENT_SOURCE_DIR}/external/jwt-cpp/include
)

link_directories(${PQXX_LIBRARY_DIRS})

file(GLOB_RECURSE SOURCES src/*.cpp src/*.cc)

add_executable(${PROJECT_NAME} ${SOURCES})

# 3. Linking
target_link_libraries(${PROJECT_NAME}
    PRIVATE
    Drogon::Drogon
    ${PQXX_LIBRARIES}
    ${PostgreSQL_LIBRARIES}
    ${HIREDIS_LIBRARIES}  # Added hiredis library
    OpenSSL::SSL
    OpenSSL::Crypto
    uuid
    pthread
    dl
)