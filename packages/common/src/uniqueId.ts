import { v4 as uuidv4 } from "uuid";
import replaceAll from "string.prototype.replaceall";
(replaceAll as any).shim();

export function generate() {
  // remove dashes because we can't easily use those in javascript variable names
  return uuidv4().replaceAll("-", "");
}
