# APP CHANGELOG
This is a changelog for the whole web app.

## Pre-release
This is the pre-release part of the changelog.
### v0.8.6
- Fixed string splitting. Used spread syntax instead of ``string.split();``.
- Added a file to parse arguments passed to the program, and to parse ``.env`` files.
- Refractored logger making code.
- Reduced number of loggers from 4 to 2.
- Updated which loggers logged where.
- Updated some ``if--else`` conditionals to use ``typeof`` instead of the not (``!``)
operator to make sure that the server doesn't crash upon a ``TypeError: Cannot read property`` error.
- Updated ``README.md``.
### v0.8.5
- Moved ``functions.js`` into a directory called ``common`` on the client side.
- Made game input event-based.
- Added a browser-side ``EventEmitter`` in ``common`` directory.
- Reworked how server and client handled game UI.
- Updated ``logCSPReport`` on server side.
- Updated the ``process.on("SIGINT");`` and how the server logs the server address.
- Update UI classes.
- Added a ``process.on("uncaughtException");`` handler to handle server crashes.
### v0.8.4
- Added a util method to get all values from a ``Map``, plus another one to convert
values into ``Map``s.
- Started using ``next(new Error())`` instead of ``socket.disconnect`` in socket.io middleware.
- Split the JS scripts for the game page and the other pages.
- Started logging process information--when the server starts up, when it crashes, etc.
- Put in some handlers in case the client isn't able to connect to the server
on the play page.
- Update ``mixUp`` method in ``util.js``.
- Made ``.html`` files use absolute paths
### v0.8.3
- Updated .eslintrc.json because of style changes.
- Started using ``morgan`` and ``debug`` modules for logging stuff debugging
messages and requests.
- Moved all of the common methods and stuff (e.g, common methods, manager
instance, Constants, etc) into a folder called common.
- Updated the ``SessionStorage`` class to use ``Map``s.
### v0.8.2
- Changed ``German`` team into ``Prussian`` team.
- Started using sprite sheets more.
- Updated ``handleOther`` method.
- Updated how the router handles requests; now the ``fs.createReadStream`` use absolute paths.
- Added a line in the ``methodNotAllowed`` function to send an ``Allow`` header.
- Added support for the new ``report-to`` CSP directive.
- Added a some scripts in package.json.
- Re-thought how the game is going to work.
- Finished the resource stat display for the game.
### v0.8.1
- Added a ``UIElement`` base class for the UI elements to further use the OOP nature of
JavaScript.
- Changed the UI layout a bit on the client side.
- Changed the layout of constants in ``Constants.js``.
- Changed the way the client draws the stat board.
- Added some more constants to ``Constants.js``.
- Adjusted the game classes to work with the new constants layout.
### v0.8.0
- Got the game to draw the basic UI.
- Added a function to get all of the non-function properties of an object, to rid
objects of any properties that are should not be emitted to the client; those properties are
useless anyway to the client, and just take up bandwidth.
- Changed ``LICENSE`` from a GNU GPL license to a GNU AGPL.
- Updated some client things.
- Added a ``license.html`` file.
- Removed some useless auth.
- Changed stylistic guidelines.
### v0.7.2
- Cleaned up some of the code--meaning that I replaced some ``if-else`` statements
with ternaries.
- Fixed some code that was bound to cause problems later on(like the switch statements that used
the ``||`` operator in the case blocks).
- Added a static ``create`` method in ``Building.js``.
- Updated the ``deepClear`` method in ``Util.js``, added a ``logMemoryUsage`` method in Util as well
- Made the game able to draw buildings.
- Added an event handler so that when the client presses ``Enter`` for the game-select form, it doesn't submit
to the server.
- Changed ``npm start`` script to ``npm run dev``.
- Name changes.
- Changed game world size.
### v0.7.1
- Got the server-to-client game communications up and running.
- Got the client-side game to draw something on the canvas.
- Updated ``README.md``.
### v0.7.0
- Completely re-thought how the ``Socket.IO`` server is going to work.
- Re-done main client.js file.
- Deleted game changelog.
- Added XHR router for XHR requests.
- Went on a mission to eliminate all ``console`` logging and replace them with
``winston`` logging that are for production uses.
- Dropped the ``.io`` part of the name; now the game is called ``colonialwars``.
### v0.6.0
- Security updates. Added sessions and lots of security middleware.
- Going to use ``winston`` for logging most production stuff.
- Extensive work has began on the client files.
- JQuery UI now is being used.
- Started using ``cookie-parser`` middleware.
- Created file ``middleware.js`` for storing ``Express`` and ``Socket.IO`` middleware.
### v0.5.1
- Big brain physics handling has started on the server side.
- Set up ``WebSockets`` handlers.
### v0.5.0
- Work has started on the client-side stuff.
- Server-side game still needs work; we aren't done yet!
- Deleted ``Shared`` folder; moved contents elsewhere.
- Removed ``@version`` part of every file's starting JSDoc.
### v0.4.0
- Kept working on serverside game.
- Added more CSP headers(and debugging them).
- Removed unneeded imports.
- Changed some style stuff in eslint.
### v0.3.1
- ``winston`` approved as a logger.
- Added logs directory to store the logs.
- Added a bunch of handlers.
### v0.3.0
- Html nonsense.
- Added Game directory and game things.
- Added ``Constants.js``.
- Testing ``winston`` as a logger.
- Server ``file not found`` handling.
- Server CSP report handling.
### v0.2.1
- Ditched ``.php`` files because they complicate things too much. Used ``.html`` files instead.
- Debugging things.
### v0.2.0
- Added ``Public`` directory, with Images directory, CSS directory,
``.php`` files, and Common directory.
- Added init.php for improved security.
- Fixed some things with the server that was bound to cause problems.
- Renamed game to colonialwars.io.
- Incorporated jquery ui into the web app.
### v0.1.1
- Continued building server.js and Router.js.
- Fixed some bugs that was disrupting the program in
Security.js and Router.js.
### v0.1.0
- Added server.js, Security.js, and Router.js.
- Added the .md files.
- Added the .json files.
