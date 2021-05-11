export default interface SuggestionItem {
  name: string;
  groupName: string;

  match(query: string): boolean;
}
