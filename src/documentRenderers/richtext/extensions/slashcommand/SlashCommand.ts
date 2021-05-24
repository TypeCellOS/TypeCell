import { Editor, Range } from "@tiptap/core";
import React from "react";
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
  aliases: string[];
  groupName: string;
  // other parameters initialized in the constructor

  /**
   * Constructs a new slash-command.
   *
   * @param name The name of the command
   * @param group Used to organize the menu
   * @param execute The callback for creating a new node
   * @param aliases Aliases for this command
   * @param icon To be shown next to the name in the menu
   */
  constructor(
    public name: string,
    public group: CommandGroup,
    public execute: SlashCommandCallback,
    aliases: string[],
    public icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>,
    public hint?: string,
    public shortcut?: string
  ) {
    this.aliases = aliases ?? [];
    this.groupName = group;
  }

  match(query: string): boolean {
    return (
      this.name.toLowerCase().startsWith(query.toLowerCase()) ||
      this.aliases.filter((alias) =>
        alias.toLowerCase().startsWith(query.toLowerCase())
      ).length !== 0
    );
  }
}
