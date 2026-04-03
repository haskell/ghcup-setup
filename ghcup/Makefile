.PHONY: dist/index.js

BUN ?= bun

dist/index.js:
	$(BUN) build --target=node --minify --outfile=$@ src/index.ts
