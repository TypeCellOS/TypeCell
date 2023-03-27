import * as nano from "nanoid";
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const nanoid = nano.customAlphabet(alphabet, 12);

export function generateId() {
  // remove dashes because we can't easily use those in javascript variable names
  return nanoid();
}
