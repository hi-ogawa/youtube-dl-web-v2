# everything phony
.PHONY: $(shell grep --no-filename -E '^([a-zA-Z_-]|/)+:' $(MAKEFILE_LIST) | sed 's/:.*//')

docker/up:
	docker-compose up -d

docker/down:
	docker-compose down

docker/clean:
	docker-compose down -v --remove-orphans
	docker-compose rm -f -s -v

localstack/reset: localstack/reset/dev localstack/reset/test

localstack/reset/dev:
	pnpm -s awslocal s3 rb s3://development --force || true
	pnpm -s awslocal s3api create-bucket --bucket development
	pnpm -s awslocal s3api put-bucket-cors --bucket development --cors-configuration file://misc/s3/cors.json

localstack/reset/test:
	pnpm -s awslocal s3 rb s3://test --force || true
	pnpm -s awslocal s3api create-bucket --bucket test
	pnpm -s awslocal s3api put-bucket-cors --bucket test --cors-configuration file://misc/s3/cors.json
