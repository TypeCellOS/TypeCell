/**
 * A generic interface used in all suggestion menus (slash menu, mentions, etc)
 *
 * Always start the [iconUrl] with / \
 * The root for the [iconUrl] is the folder 'public', which means you must be \
 * able to access your image by going to localhost:3000[iconUrl]
 */
export default interface SuggestionItem {
  name: string;
  groupName: string;
  icon?: JSX.Element;
  hint?: string;

  match(query: string): boolean;
}
