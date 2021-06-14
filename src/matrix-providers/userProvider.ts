import {
  Mention,
  MentionType,
} from "../documentRenderers/richtext/extensions/mentions/Mention";
import { MatrixClientPeg } from "../matrix-auth/MatrixClientPeg";

export async function searchUsersViaMatrix(query: string) {
  const peg = MatrixClientPeg.get();
  if (!peg) {
    return [];
  }
  const ret = await peg.searchUserDirectory({
    term: query || "mx", // mx is a trick to return all users on mx.typecell.org
    limit: 10,
  });
  if (ret.results.length) {
    const results: Mention[] = ret.results.map(
      (r: any) => new Mention(r.display_name, MentionType.PEOPLE)
    );
    if (!query) {
      // if searching all users, sort ourselves
      return results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
  }
  return [];
}
