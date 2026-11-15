# ---------- build stage ----------
FROM ubuntu:24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ cmake make git ca-certificates pkg-config \
    libjsoncpp-dev uuid-dev zlib1g-dev libssl-dev libc-ares-dev \
    libpq-dev libpqxx-dev libhiredis-dev libbrotli-dev \
    && rm -rf /var/lib/apt/lists/*

# Drogon (pinned) — built from source
RUN git clone --depth 1 --branch v1.8.7 --recurse-submodules --shallow-submodules https://github.com/drogonframework/drogon /tmp/drogon \
    && cmake -S /tmp/drogon -B /tmp/drogon/build -DCMAKE_BUILD_TYPE=Release -DBUILD_EXAMPLES=OFF -DBUILD_CTL=OFF \
    && cmake --build /tmp/drogon/build -j"$(nproc)" && cmake --install /tmp/drogon/build && rm -rf /tmp/drogon

# jwt-cpp (pinned commit; header-only)
RUN git clone https://github.com/Thalhammer/jwt-cpp /tmp/jwt-cpp && git -C /tmp/jwt-cpp checkout 0a503e7

WORKDIR /src
COPY CMakeLists.txt ./
COPY include ./include
COPY src ./src
# Two compile jobs at a time and an eager compiler garbage collector keep memory low enough for a free build machine.
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-I/tmp/jwt-cpp/include --param ggc-min-expand=20 --param ggc-min-heapsize=32768" \
    && cmake --build build -j2

# ---------- runtime stage ----------
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive AEROBASE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjsoncpp25 libuuid1 zlib1g libssl3t64 libcares2 libpq5 libpqxx-7.8t64 libhiredis1.1.0 libbrotli1 ca-certificates curl python3 postgresql-client \
    && rm -rf /var/lib/apt/lists/* && useradd -r -u 10001 aerobase
WORKDIR /app
COPY --from=build /usr/local/lib/ /usr/local/lib/
RUN ldconfig
COPY --from=build /src/build/AeroBaseIndia /app/AeroBaseIndia
COPY src/config/config.json /app/config.json
COPY migrations /app/migrations
COPY scripts /app/scripts
RUN chmod +x /app/scripts/docker-entrypoint.sh
USER aerobase
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s CMD curl -fsS http://localhost:${PORT:-8080}/health || exit 1
CMD ["/app/scripts/docker-entrypoint.sh"]
