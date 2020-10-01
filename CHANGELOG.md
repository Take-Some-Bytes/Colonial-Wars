# COLONIALWARS CHANGELOG
This is a changelog for the whole web app.

The format is based on [Keep a Changelog],
and this project (kind-of) adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# Pre-production releases
This CHANGELOG logs the pre-production releases of this app. Pre-production releases are not
guaranteed to be stable, and are in active development. By this project's standards, all pre-production
release version numbers **must** start with `v0`.

***NOTE:*** This new changelog was written in [v0.3.6], thus, there may be some mistakes. Please
feel free to open an [issue](https://github.com/Take-Some-Bytes/Colonial-Wars/issues) if you find
one.

Pre-production releases are not tagged on github, except for those thatt mark important
deadlines. But, production builds are still not available for those releases.
## [v0.4.3] - 2020-09-30
### Added:
- Added `io` as an eslint global, so that we don't have to disable eslint-no-undef for the
client files where they use `io`.
### Changed:
- Commented a *lot* of unneeded code in various files.
- Updated client files to remove the using of deprecated features.
- Updated JSDocs and type definitions (because I like to have VSCode Intellisense).
### Fixed:
- Fixed error reporting to be more useful.
### Removed:
- Removed most of the UI management from the server side.
## [v0.4.2] - 2020-09-24
### Added:
- Added ``/Lib/store.js`` for the session store class.
### Changed:
- Bumped all dependencies up to the latest versions.
- Used a proper session storage class instead of just a JavaScript
[``Map``](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) to
store "pending client data", which was, in fact, session data.
- Added more helper functions to help out the JWT ``Socket.IO`` authentication.
### Fixed:
- Fixed JWT ``Socket.IO`` authentication. This is now stable.
## [v0.4.1] - 2020-09-08
### Added:
- Added comments in all the JavaScript files to describe and clarify code, and also
added codetags, inspired by [python codetags](https://www.python.org/dev/peps/pep-0350/),
to remind me of what I need to do.
- Officially added ESLint and its required plugins as [Development Dependencies](https://docs.npmjs.com/files/package.json#devdependencies).
### Changed:
- Changed ESLint rules:
  1. Removed deprecated rules, and replaced them with their replacement plugins.
  2. Reviewed current rules, and changed some to suit the needs of this project.
- Updated README. Removed `Note on the different branches` section, added `Status of this Project`
section.
- Updated all files to use `CRLF`, as opposed to `LF`.
## [v0.4.0] - 2020-08-23
### Added:
- [``jsonwebtoken``](https://www.npmjs.com/package/jsonwebtoken) for ``Socket.IO`` authentication, instead of
the mess that I used before.
- Added new helper functions for the new ``Socket.IO`` authentication implementation.
### Changed:
- Changed client files to use default exports instead of plain old exports when possible.
- Changed how the ``Socket.IO`` server works! Before, it was something like this:
  1. Client connects to the root ``Socket.IO`` namespace (`"/"`),
  2. Server creates a new wsSession for the client, and adds the client
    to an internal clients map.
  4. Client sends data to join a game,
  5. Server creates an entry in an object that stores data about the 
    data that the client sent. Then, the server tells the client to
    proceed, meanwhile with the client saving the previous ``socket.id``
    in the localStorage,
  6. Client connects to the ``play`` namespace, along with their previous ``socket.id``,
  7. Server does a bunch of ID swapping, eventually allowing the client into the game.

  Now, it's like this:
  1. Client aquires ``socketIOAuth`` from a XHR route in the form as a cookie,
  2. On that request, the server creates an entry in the pendingClients ``Map``,
    with data about whether the client is connected and such.
  3. Client connects to the root ``Socket.IO`` namespace (`"/"`),
  4. Server verifies the client's ``socketIOAuth`` cookie, and updates the client's
    entry in the pendingClients ``Map``,
  5. Client sends data to join a game,
  6. Server updates the client's entry in the pendingClients ``Map``,
  7. Client connects to the ``play`` namespace.
  8. Server verifies ``socketIOAuth`` cookie again, and allows the client
    in.
- Updated all files to adhere to this new authentication process.
### Removed:
- Removed what's left of the ``/Lib/Security`` directory.
## [v0.3.8] - 2020-08-16
### Added:
- [``helmet``](https://www.npmjs.com/package/helmet) for securing this Node.JS
app instead of using custom solutions.
- Added some client files to display errors that the server sends to the client.
- Added a method to parse cookies on the client side.
### Changed:
- Used the built-in express middleware for parsing request body instead
of a custom solution.
- Updated server to conform to [this](https://www.loggly.com/wp-content/uploads/2015/06/http-decision-diagram.png) HTTP decision diagram.
- Updated how the server sends errors to the client. Now the server sends a HTML
page for displaying errors.
- Updated eslint config.
- Updated files to conform to the new eslint rules.
### Fixed:
- Fixed broken imports on client side JavaScript files.
### Removed:
- ``/Lib/Security/Security.js``. All the functionality the ``Security`` class provided
is now integrated directly into the app.
## [v0.3.7] - 2020-08-08
### Changed:
- Updated eslint configurations--now a space **must** be after every comment.
- Renamed the main server file from ``server.js`` to ``server-standalone.js``.
- Made Express an [optional dependency](https://docs.npmjs.com/files/package.json#optionaldependencies). The reason for why will be revealed later.
## [v0.3.6] - 2020-07-31
### Changed:
- Reworked this changelog into the [Keep a Changelog] format.
- Reworked the versioning of this project.
## [v0.3.5] - 2020-07-27
### Added:
- Added ``/config/config.js`` to parse program arguments and to parse ``.env`` files.
### Changed:
- Reduced number of winston loggers from 4 to 2
- Refractored the code that was making the loggers.
### Fixed:
- Fixed string splitting to use spread syntax (``...``) instead of ``string.split("");``.
- Fixed some ``if--else`` conditionals to use ``typeof`` instead of the not (``!``)
so that the server doesn't crash upon a ``TypeError: Cannot read property`` error.
- Fixed how the server shuts down--now, the server keeps an array of existing ``socket.io``
connections so that the server can close them on shutdown.
## [v0.3.4] - 2020-07-21
### Added:
- Added a browser-side ``EventEmitter`` in ``/Public/JS/common``.
### Changed:
- Moved ``functions.js`` from ``/Public/JS`` to ``/Public/JS/common``.
- Renamed some images on the client-side.
- Renamed some game graphic files.
- Updated the client-side game to use event-based input.
- Updated the game's UI handling so that things will work properly.
- Updated this web app's favicon.
### Fixed:
- Fixed how the server shuts down on an uncaught exception and a SIGINT signal. The
server now shuts down gracefully.
## [v0.3.3] - 2020-07-14
### Added:
- Added a few methods to get values from ``Map``s, and to convert values into ``Map``s.
### Changed:
- Separated the game specific code and other code into two files--``client.js`` and
``client-game.js``.
### Fixed:
- Fixed how the ``Socket.IO`` server rejects client connections--instead of just plainly
disconnecting them, used ``next(new Error());`` instead.
- Fixed all ``.html`` files to use absolute URLs instead of relative ones.
### Removed:
- Removed a winston logger called ``ErrorLogger``.
## [v0.3.2] - 2020-07-08
### Added:
- Started using ``morgan`` to log requests, and ``debug`` to log debugging messages.
### Changed:
- Moved common server files into ``/Lib/common``.
- Updated eslint styles: now all JavaScript statements that could have a semicolon at the end
*must* have one.
- Updated all server files to work with the new location of common server files.
- Updated the ``SessionStorage`` class to use ``Map``s.
## [v0.3.1] - 2020-06-16
### Added:
- New game graphics! Now most game graphics are on sprite sheets instead of individual files.
### Changed:
- Updated client-side game so that all the UI could be drawn properly.
- Updated all client-side game files to utilize sprite sheets correctly.
- Updated server to handle [HTTP 405](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405)
correctly.
- Updated the server's way of handling routes that are not defined by default.
### Fixed:
- Fixed server to read files from absolute paths--it's less error-prone that way.
- Fixed a bug that was preventing the number 0 to be passed as a value to an UIElement.
### Removed:
- All old game graphics that were in individual files. 
## [v0.3.0] - 2020-06-11
### Added:
- Added most game images in ``/Public/Images``.
- Actually uploaded the license and license text files for the front-end.
- Added more game UI: next are icons, and a base class called ``UIElement``.
### Changed:
- Changed the ***entire*** layout of constants in ``Constants.js``. Also adjusted all
server-side files to utilize the new layout correctly.
- Updated the ``Button`` class to inherit from the ``UIElement`` class.
- Updated the way the client handles UI--now most of the handling logic is on the server-side,
and only the drawing logic is on the client-side.
- Updated styles in ``styles.css``.
## [v0.2.3] - 2020-06-11
### Added:
- Added a method in ``Drawing.js`` so that the client-side game could draw game buildings.
- Started adding game UI: first to come are the buttons.
### Changed:
- Changed the LICENSE from a GNU GPL v3.0 license to a GNU AGPL v3.0 license.
- Updated eslint style guidelines--now all JavaScript keywords (``for``, ``if``, etc.) have
to have a space after them.
- Updated the ``/xhr`` route:
  * Firstly, a new section was added to serve the license text,
  * Secondly, some useless authentication was removed.
## [v0.2.2] - 2020-05-27
### Added:
- A few new constants.
- A method to log the current memory usage.
### Changed:
- Updated ``deepClear`` method in ``Util.js``.
- Updated the code to use ternaries whenever possible.
- Increased the game world size to 9000 100 pixel blocks.
- Stopped using ``npm start`` to start the app. Instead used ``npm run dev``.
### Fixed:
- Used [switch fall-through](https://stackoverflow.com/questions/13207927/switch-statement-multiple-cases-in-javascr) instead of code like this:
```js
switch (someVar) {
case 10 || "this" || "that":
  doSomething();
}
```
## [v0.2.1] - 2020-05-23
### Added:
- New ``/Lib/Security`` directory to store security-related files.
- New ``/xhr`` route for XHR requests.
- ``middleware.js`` to store all the middleware that will be used on the server.
- Added most images that are going to be used on the client side.
- Added rest of client-side game files.
- Added the ``Socket.IO`` server for real-time communications.
### Changed:
- Updated eslint config--changed a few rules.
- Updated all of the game classes so that the game can actually function.
- ``.css`` styles--more of them have been added.
- Updated most files to actually *use* ``winston`` loggers.
- Renamed ``Winstoninit.js`` to ``init.js``.
### Removed:
- ``jquery-ui.js``, because there is no reason to have it here when there are lots of
CDNs serving it up.
## [v0.2.0] - 2020-04-29
### Added:
- The play page (``play.html``).
- Client-side ``.js`` files:
  * ``client.js`` and ``Constants-client.js`` for the basic client functions,
  * The ``/Public/JS/Game`` directory for client-side game files.
### Changed:
- Updated more eslint config--we're moving to all ECMAScript 2015 (ES6) block variable
definitions (``let``, ``const``)
- All ``.js`` files to conform to the new style (again).
- Moved ``Common.js`` and ``Winstoninit.js`` from ``/Lib`` to ``/Lib/Common``.
- Moved the contents of the ``Shared`` directory--server-side contents have
been moved to the ``/Lib`` directory, and client-side contents have been moved to 
the ``/Public/JS`` directory (spoiler: there weren't any).
- Changed name from ``colonialwars.io`` to ``colonialwars``.
### Removed:
- All ``@version`` tag in all ``.js`` files.
- The ``Shared`` directory (after a lot of hassling).
## [v0.1.2] - 2020-04-16
### Added:
- Added ``Shared`` directory to store:
  * Common files that will be used between the server and client,
  such as ``Util.js`` and ``Constants.js``,
  * The game files so that everything could be in one place,
  * The old game CHANGELOG.
### Changed:
- Updated ``.eslintrc.json`` configurations--now indents must be two spaces long.
- All ``.js`` files to conform to the new style.
## [v0.1.1] - 2020-03-31
### Added:
- [``winston``](https://www.npmjs.com/package/winston) for logging.
- Two more ``.js`` files: ``Winstoninit.js`` to handle initialization of winston loggers,
and ``Common.js`` for storing common server functions.
- ``logs`` directory to store server logs.
### Changed:
- Moved the old CHANGELOG and LICENSE to root.
- Updated some CSP directives.
- Updated how ``index.html`` loads resources--meaning that the resource paths don't have
a leading slash (``/``) in front of them.
- Updated styles in ``styles.css``.
- Updated methods in ``Common.js``.
## [v0.1.0] - 2020-03-29
### Added:
- Added basic server files: ``server.js``, ``Security.js``, and ``Router.js``.
- Added basic metadata files: ``package.json`` and ``package-lock.json``.
- Added the README file, eslint configuration file, and the old CHANGELOG and GNU
GPL v3.0 license file in the ``Docs`` directory (Note that this changelog was written
*after* the [v0.1.0] release--only after [v0.3.6] was this changelog updated into this format).
- Added the ``Public`` directory, containing the files that are going to be served to the public.

<!-- TODO: Change the last release link to the correct one. -->
[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/
[v0.1.0]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/b451b51754ec832dc49442895b6748b78d233c20
[v0.1.1]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/7d31bc7198253a372e40ec9f40addf74e603d9e5
[v0.1.2]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/ad055c5682b43721ec3255b77189a3fa0d6616f1
[v0.2.0]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/f6fcfa129ef7d936ef27ad903c0d4f95fb17ed82
[v0.2.1]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/ae2b821dde5a78aa13ec5bc0c2bf8121d8d7d893
[v0.2.2]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/623ddb6cde4084d563d191841ae7e8ec79d970e2
[v0.2.3]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/8ed857e9ae6d3aa734ddfa915edfe337fe0485fa
[v0.3.0]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/c124a9f3cffb4bad41a8c78768331b26d2efa909
[v0.3.1]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/2f1264e5d93951fd5f78800a6f30f9e6e7def373
[v0.3.2]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/d3d0f15958e0eec0bcfda19071e2f03c97196108
[v0.3.3]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/caa81dc44440aff280e13a27734bf5b785685455
[v0.3.4]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/b2fe62eb637915de4e66b4a1c31993aa1aebbef3
[v0.3.5]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/81e45a97785d9c4aa4c307513da86367094d0f93
[v0.3.6]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/e2cd2abd89d14c05637b79f805fbfd78e0e1b3d5
[v0.3.7]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/cce20d72524caf3df247d98e54f9047510115577
[v0.3.8]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/fc615a74a5228a266e44f7ecb46ffdeead983cad
[v0.4.0]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/0c1ef2ba053425cb204fffa1b718c88448f81c6b
[v0.4.1]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/a733f2b33f81cd43bed2c3503b7ff384275adb50
[v0.4.2]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/7ae43a0effa4dbb7cc5ee1e4da12fdd0a8e5d841
[v0.4.3]: https://github.com/Take-Some-Bytes/Colonial-Wars/tree/v0.4.3
