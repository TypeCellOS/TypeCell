/**
 * A generic interface used in all suggestion menus (slash menu, mentions, etc)
 */
export default interface SuggestionItem {
  name: string;
  groupName: string;
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  match(query: string): boolean;
}
