import SuggestionItem from "../../prosemirrorPlugins/suggestions/SuggestionItem";

export enum MentionType {
  PEOPLE = "People",
  DOCUMENTS = "Documents",
}

/**
 * A class that defines a mention.
 */
export class Mention implements SuggestionItem {
  // Used by the SuggestionPlugin
  public readonly groupName: string;

  /**
   * Constructs a new mention.
   *
   * @param name The name of the mention
   * @param type The type of the mention
   */
  constructor(public readonly name: string, public readonly type: MentionType) {
    this.groupName = type;
  }

  match(query: string): boolean {
    return this.name.toLowerCase().startsWith(query.toLowerCase());
  }
}
