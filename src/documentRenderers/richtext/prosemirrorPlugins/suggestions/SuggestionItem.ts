import { RemixiconReactIconComponentType } from "remixicon-react";

/**
 * A generic interface used in all suggestion menus (slash menu, mentions, etc)
 */
export default interface SuggestionItem {
  name: string;
  groupName: string;
  icon?: RemixiconReactIconComponentType;

  match(query: string): boolean;
}
