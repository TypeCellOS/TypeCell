import { Node, Schema } from "prosemirror-model";
import { Editor } from "@tiptap/core";

export type SlashCommandCallback = (
  editor: Editor,
  args?: any[]
) => Node<Schema<any, any>>;

export function matchSlashCommand(
  commandMap: { [key: string]: SlashCommand },
  command: string
): { command: SlashCommand; args: any[] } | undefined {
  const commandName = command.toLowerCase();

  for (const key in commandMap) {
    const cmd = commandMap[key];

    const match = commandName.match(cmd.regex);

    if (match) {
      return { command: cmd, args: match.slice(2) };
    }
  }

  return undefined;
}

/**
 * A class that defines a slash command (/<command>).
 *
 * Not to be confused with ProseMirror commands nor TipTap commands.
 */
export class SlashCommand {
  name: string;
  aliases?: string[];
  regex: RegExp;

  callback: SlashCommandCallback;

  /**
   * Constructs a new slash-command. One can either supply a name and aliases,
   * the constructor will then automatically generate a regular expression,
   * or one can supply a name combined with a custom regex,
   * this custom regex will then be used for matching this command.
   *
   * An example of a custom regex could look like: `\(heading|h)([1-6?])\`.
   * The matched groups (bits between parentheses) are passed as arguments in the command's callback function.
   *
   * @param name The name of the command
   * @param callback The callback for creating a new node
   * @param aliases
   * @param regex A regex for matching this command. This regex fully determines matching behaviour when supplied.
   */
  constructor(
    name: string,
    callback: SlashCommandCallback,
    aliases?: string[],
    regex?: RegExp
  ) {
    this.name = name.toLowerCase();
    this.aliases = aliases?.map((val) => val.toLowerCase());
    this.callback = callback;

    if (regex) {
      const newRegex = `\\b(${regex.source})\\b`;

      console.log(newRegex);
      this.regex = new RegExp(newRegex);
    } else {
      let rawRegex = `\\b(${this.name}`;

      rawRegex = this.aliases
        ? this.aliases.reduce((acc, alias) => acc + "|" + alias, rawRegex)
        : rawRegex;

      rawRegex += ")\\b";

      this.regex = new RegExp(rawRegex);
    }
  }
}
