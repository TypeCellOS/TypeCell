import { v4 as uuidv4 } from "uuid";
const replaceAll = require("string.prototype.replaceall");
replaceAll.shim();

export function generate() {
  // remove dashes because we can't easily use those in javascript variable names
  return uuidv4().replaceAll("-", "");
}
