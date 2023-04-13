import * as nano from "nanoid";
import { UnreachableCaseError } from "./error";
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const nanoid = nano.customAlphabet(alphabet, 12);

export function generateId(type: "document" | "block") {
  // don't start with a number because programming languages don't like that for variable names
  let id = nanoid();
  while (id[0] >= "0" && id[0] <= "9") {
    id = nanoid();
  }

  if (type === "document") {
    return "d" + id;
  } else if (type === "block") {
    return "b" + id;
  } else {
    throw new UnreachableCaseError(type);
  }
}
