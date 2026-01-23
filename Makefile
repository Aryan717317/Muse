.PHONY: dev build start lint clean docker-build

# Development
dev:
	npm run dev

# Installation
install:
	npm install

# Build
build:
	npm run build

# Docker
docker-build-server:
	docker build -f apps/server/Dockerfile -t muse-server .

docker-build-web:
	docker build -f apps/web/Dockerfile -t muse-web .

docker-up:
	docker-compose up -d

# Redis (Local)
redis-up:
	docker run -d --name muse-redis -p 6379:6379 redis:alpine

redis-down:
	docker stop muse-redis && docker rm muse-redis

# Utilities
clean:
	rm -rf apps/web/.next apps/web/out apps/server/dist
