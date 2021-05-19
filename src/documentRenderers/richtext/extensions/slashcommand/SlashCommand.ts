import { Editor, Range } from "@tiptap/core";
import SuggestionItem from "../../prosemirrorPlugins/suggestions/SuggestionItem";

export type SlashCommandCallback = (editor: Editor, range: Range) => boolean;

export enum CommandGroup {
  HEADINGS = "Headings",
  BASIC_BLOCKS = "Basic Blocks",

  // Just some examples, that are not currently in use
  INLINE = "Inline",
  EMBED = "Embed",
  PLUGIN = "Plugin",
}

/**
 * A class that defines a slash command (/<command>).
 *
 * Not to be confused with ProseMirror commands nor TipTap commands.
 */
export class SlashCommand implements SuggestionItem {
  name: string;
  group: CommandGroup;
  aliases: string[];
  execute: SlashCommandCallback;
  groupName: string;

  match(query: string): boolean {
    return (
      this.name.toLowerCase().startsWith(query.toLowerCase()) ||
      this.aliases.filter((alias) =>
        alias.toLowerCase().startsWith(query.toLowerCase())
      ).length !== 0
    );
  }

  /**
   * Constructs a new slash-command.
   *
   * @param name The name of the command
   * @param execute The callback for creating a new node
   * @param aliases Aliases for this command
   * @param regex A regex for matching this command. This regex fully determines matching behaviour when supplied.
   */
  constructor(
    name: string,
    group: CommandGroup,
    execute: SlashCommandCallback,
    aliases?: string[]
  ) {
    this.name = name;
    this.group = group;
    this.groupName = group;
    this.aliases = aliases ?? [];
    this.execute = execute;
  }
}
