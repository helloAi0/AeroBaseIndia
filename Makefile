.PHONY: build run test clean migrate logs

build:
	cd build && cmake .. && make -j$(nproc)

run:
	pkill -f AeroBaseIndia 2>/dev/null || true
	sleep 1
	cd build && ./AeroBaseIndia &
	cd ml_service && python3 app.py &

test:
	curl -s http://localhost:8080/health | python3 -m json.tool
	curl -s http://localhost:8080/metrics | grep -v "^#"
	curl -s http://localhost:8080/traces | python3 -m json.tool

migrate:
	@for f in $$(ls migrations/*.sql | sort); do \
		cp $$f /tmp/ && sudo -u postgres psql -d aerobase -f /tmp/$$(basename $$f) 2>/dev/null || true; \
	done
	@echo "Migrations done"

clean:
	rm -rf build/*
	cmake -B build

logs:
	tail -f build/*.log 2>/dev/null || echo "No log files found"

stop:
	pkill -f AeroBaseIndia 2>/dev/null || true
	pkill -f "python3 app.py" 2>/dev/null || true
	echo "Stopped"

status:
	curl -s http://localhost:8080/health | python3 -m json.tool

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
