import { v4 as uuidv4 } from "uuid";

export function generateUuid() {
  // remove dashes because we can't easily use those in javascript variable names
  return uuidv4();
}
