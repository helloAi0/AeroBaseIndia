FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    make \
    git \
    libpqxx-dev \
    libpq-dev \
    uuid-dev \
    libjsoncpp-dev \
    openssl \
    libssl-dev

WORKDIR /app

COPY . .

RUN mkdir build && cd build && \
    cmake .. && \
    make

EXPOSE 8080

CMD ["./build/AeroBase"]