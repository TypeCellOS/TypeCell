import { ENVIRONMENT } from "../config/config";
import { parseIdentifier, tryParseIdentifier } from "../identifiers";

export default function routing() {
  const parts = window.location.pathname.split("/").filter((p) => p.length);
  const path = window.location.pathname.startsWith("/")
    ? window.location.pathname.substring(1)
    : window.location.pathname;

  const parsedIdentifier = tryParseIdentifier(path);
  if (parsedIdentifier !== "invalid-identifier") {
    return {
      page: "document" as "document",
      identifier: parsedIdentifier,
    };
  }

  const part1 = parts[0]?.toLowerCase();

  if (part1 === "docs") {
    let [, ...remainingParts] = parts;
    let remainingPath = remainingParts.join("/");

    const id =
      ENVIRONMENT === "DEV"
        ? parseIdentifier(
            "fs:" + (remainingPath ? "/:/" + remainingPath : ""),
            "Docs"
          )
        : /*parseIdentifier(
            "github:yousefed/typecell-next/docs" +
              (remainingPath ? "/:/" + remainingPath : "")
          );*/
          parseIdentifier(
            "https:/_docs/index.json" +
              (remainingPath ? "/:/" + remainingPath : ""),
            "Docs"
          );

    // overwrite reverse route (bit hacky)
    id.toRouteString = () => {
      return "/docs" + (id.subPath ? "/" + id.subPath : "");
    };
    return {
      page: "document" as "document",
      identifier: id,
    };
  } else if (part1 && part1.startsWith("@")) {
    return { page: "owner" as "owner", owner: part1 }; // TODO: what if user pages should have subpages?
  } else if (part1 === "login") {
    return { page: "login" as "login" };
  } else if (part1 === "register") {
    return { page: "register" as "register" };
  } else if (part1 === "recover") {
    return { page: "recover" as "recover" };
  } else if (!part1) {
    return { page: "root" as "root" };
  } else {
    throw new Error("unknown page"); // TODO: not found
  }
}
