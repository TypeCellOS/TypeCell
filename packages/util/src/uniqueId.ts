import * as nano from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { UnreachableCaseError } from "./error.js";

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const nanoid = nano.customAlphabet(alphabet, 12);

export function generateId(type: "document" | "block" | "reference") {
  // don't start with a number because programming languages don't like that for variable names
  let id = nanoid();
  while (id[0] >= "0" && id[0] <= "9") {
    id = nanoid();
  }

  if (type === "document") {
    return "d" + id;
  } else if (type === "block") {
    return "b" + id;
  } else if (type === "reference") {
    return "r" + id;
  } else {
    throw new UnreachableCaseError(type);
  }
}

export function generateUuid() {
  // remove dashes because we can't easily use those in javascript variable names
  return uuidv4();
}
