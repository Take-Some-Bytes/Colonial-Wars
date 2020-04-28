/**
 * @fileoverview The server of this web app. Made with express.js
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");

//Variables
const PROTOCOL = "http";
const PORT = PROTOCOL === "http" ? 80 : 443;
const HOST = "localhost";

//Custom modules
const router = require("./Lib/Router");

//Initialization
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//Security
app.disable("x-powered-by");

//Server stuff
app.use("/dist", express.static(path.join(__dirname, "dist")));
app.use("/JS", express.static(path.join(__dirname, "Public/JS")));
app.use("/CSS", express.static(path.join(__dirname, "Public/CSS")));
app.use("/imgs", express.static(path.join(__dirname, "Public/Images")));
app.use("/", router);

server.listen(PORT, HOST, 20, () => {
  console.log(`Server started on port ${PORT}, http://${HOST}.`);
  console.log(`Protocol is: ${PROTOCOL}.`);
  const used = process.memoryUsage();
  for(const key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
});
