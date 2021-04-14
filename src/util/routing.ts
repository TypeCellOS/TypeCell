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

  owner = owner || "@yousefed";
  document = document || "home";

  return { owner, document, remainingParts };
}
