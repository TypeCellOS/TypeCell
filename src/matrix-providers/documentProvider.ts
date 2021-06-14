import {
  Mention,
  MentionType,
} from "../documentRenderers/richtext/extensions/mentions/Mention";
import { MatrixClientPeg } from "../matrix-auth/MatrixClientPeg";

// TODO: doesn't work yet (rooms are hidden)
export async function searchDocumentsViaMatrix(query: string) {
  const peg = MatrixClientPeg.get();
  if (!peg) {
    return [];
  }
  const ret = await peg.publicRooms({
    filter: {
      generic_search_term: query || "mx", // mx is a trick to return all rooms on mx.typecell.org
    },
    limit: 10,
  });
  if (ret.chunk.length) {
    debugger;
    const results: Mention[] = ret.results.map(
      (r: any) => new Mention(r.display_name, MentionType.DOCUMENTS)
    );
    if (!query) {
      // if searching all users, sort ourselves
      return results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
  }
  return [];
}
