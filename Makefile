dev: 
	clear&&DEBUG=colonialwars node --inspect server.js
find-sync-io:
	node --trace-sync-io server.js
sec-check:
	npm audit&&npm outdated
staging:
	node server.js
list:
	cat Makefile
