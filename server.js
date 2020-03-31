/**
 * @fileoverview The server of this web app. Made with express.js
 * @author Horton Cheng <horton0712@gmail.com>
 * @version 1.0.0
 */

//Dependencies
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");

//Variables
var PROTOCOL = "http";
var PORT = PROTOCOL === "http" ? 80 : 443;
var HOST = "localhost";

//Custom modules
const router = require("./Lib/Router");

//Initialization
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

//Server stuff
app.use("/game", express.static(path.join(__dirname, "Shared/Game/Public")));
app.use("/shared", express.static(path.join(__dirname, "Shared")));
app.use("/JS", express.static(path.join(__dirname, "Public/JS")));
app.use("/CSS", express.static(path.join(__dirname, "Public/CSS")));
app.use("/imgs", express.static(path.join(__dirname, "Public/Images")));
app.use("/", router);

server.listen(PORT, HOST, 20, () => {
   console.log(`Server started on port ${PORT}, http://${HOST}.`);
   console.log(`Protocol is: ${PROTOCOL}.`);
});
