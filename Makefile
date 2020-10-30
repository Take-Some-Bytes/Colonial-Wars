dev: 
	clear&&DEBUG=colonialwars node --inspect server-standalone.js
find-sync-io:
	node --trace-sync-io server-standalone.js
sec-check:
	npm audit&&npm outdated
staging:
	node server.js
list:
	cat Makefile
