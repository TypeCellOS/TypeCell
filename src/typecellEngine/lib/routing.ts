export default function routing() {
  const paths = window.location.pathname.split("/");
  let owner: string | undefined;
  let document: string | undefined;
  let remainingParts: string[] = [];
  for (let path of paths) {
    if (!path.length) {
      continue;
    }
    if (!owner) {
      owner = path.toLowerCase();
      continue;
    }
    if (!document) {
      document = path.toLowerCase();
      continue;
    }
    remainingParts.push(path);
  }

  if (document && owner) {
    return { page: "document" as "document", owner, document, remainingParts };
  } else if (owner) {
    return { page: "owner" as "owner", owner };
  } else {
    return { page: "root" as "root" };
  }
}
