.PHONY: all test clean

lint:
	./node_modules/.bin/eslint --fix lib/*.js test/*.js

test-data:
	node ./test/fixtures/data.js

test:
	make test-data
	./node_modules/.bin/mocha -R spec test/*.test.js --timeout 15000

cov:
	make test-data
	./node_modules/.bin/nyc --reporter=html --reporter=text ./node_modules/.bin/mocha -R spec test/*.test.js --timeout 15000

ci:
	make lint
	make cov
	./node_modules/.bin/codecov

clean:
	rm -rf coverage