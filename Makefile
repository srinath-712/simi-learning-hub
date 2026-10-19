.PHONY: test build

test:
	npm run lint
	npm run typecheck
	npm run build

build:
	npm run build
