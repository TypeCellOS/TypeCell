export default function routing() {
  const paths = window.location.pathname.split("/");
  let part1: string | undefined;
  let part2: string | undefined;
  let remainingParts: string[] = [];
  for (let path of paths) {
    if (!path.length) {
      continue;
    }
    if (!part1) {
      part1 = path.toLowerCase();
      continue;
    }
    if (!part2) {
      part2 = path.toLowerCase();
      continue;
    }
    remainingParts.push(path);
  }

  if (part2 && part1 && part1.startsWith("@")) {
    return {
      page: "document" as "document",
      owner: part1,
      document: part2,
      remainingParts,
    };
  } else if (part1 && part1.startsWith("@")) {
    return { page: "owner" as "owner", owner: part1 };
  } else if (part1 === "login") {
    return { page: "login" as "login" };
  } else if (part1 === "register") {
    return { page: "register" as "register" };
  } else if (!part1) {
    return { page: "root" as "root" };
  } else {
    throw new Error("unknown page"); // TODO: not found
  }
}
