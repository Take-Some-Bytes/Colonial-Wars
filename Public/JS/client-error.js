/**
 * @fileoverview Script for handling rendering of
 * error messages on client-side.
 * @author Horton Cheng <horton0712@gmail.com>
 */

import { parseCookies } from "./common/functions.js";

const cookies = parseCookies(document.cookie);
console.log(cookies);
const statusCode = parseFloat(cookies.statusCode);
const reason = cookies.reason;
console.log(statusCode);

if (typeof statusCode !== "number" || isNaN(statusCode)) {
  console.error("No status code!");
} else {
  let message = "";
  // const errorImg = new Image();
  // errorImg.src = `/imgs/${statusCode}-error.png`;
  // errorImg.alt = "Error image.";
  // errorImg.onload = e => {
  //   document.body.innerHTML = `Error: status is ${statusCode}.`;
  // };
  // errorImg.onerror = (e, src, lineNo, colNo, err) => {
  //   if (err instanceof Error) {
  //     const message = [
  //       `Message: ${
  //         typeof e === "object" ?
  //           JSON.stringify(e) :
  //           String(e)
  //       }`,
  //       `URL: ${src}`,
  //       `Line: ${lineNo}`,
  //       `Column: ${colNo}`,
  //       `Error object: ${err.stack}`
  //     ].join("\r\n");

  //     console.error(message);
  //   }
  // };
  if (statusCode === 401) {
    if (typeof reason !== "string") {
      console.error("No reason for authentication failure!");
    } else {
      message = `Authentication failed. Reason: ${reason}.`;
    }
  } else {
    message = `Error: status is ${statusCode}.`;
  }
  document.body.innerHTML = message;
}
