import { Editor, Range } from "@tiptap/core";
import SuggestionItem from "../../prosemirrorPlugins/suggestions/SuggestionItem";

export type MentionCallback = (editor: Editor, range: Range) => boolean;

export enum MentionType {
  PEOPLE = "People",
  DOCUMENTS = "Documents",
}

/**
 * A class that defines a mention.
 */
export class Mention implements SuggestionItem {
  name: string;
  type: MentionType;

  // Used by the SuggestionPlugin
  groupName: string;

  match(query: string): boolean {
    return this.name.toLowerCase().startsWith(query.toLowerCase());
  }

  /**
   * Constructs a new mention.
   *
   * @param name The name of the mention
   * @param type The type of the mention
   */
  constructor(name: string, type: MentionType) {
    this.name = name;
    this.type = type;
    this.groupName = type;
  }
}
