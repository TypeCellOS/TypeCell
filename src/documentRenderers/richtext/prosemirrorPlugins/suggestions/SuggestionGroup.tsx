import { MenuGroup, Section, ButtonItem } from "@atlaskit/menu";

import SuggestionItem from "./SuggestionItem";
import styles from "./SuggestionGroup.module.css";

type SuggestionGroupProps<T> = {
  /**
   * Name of the group
   */
  name: string;

  /**
   * The list of items
   */
  items: T[];

  /**
   * Index of the selected item in this group; relative to this item group (so 0 refers to the first item in this group)
   * This should be 'undefined' if none of the items in this group are selected
   */
  selectedIndex?: number;

  /**
   * Callback for handling clicking on an item
   */
  clickItem: (item: T) => void;
};

export function SuggestionGroup<T extends SuggestionItem>(
  props: SuggestionGroupProps<T>
) {
  return (
    <Section title={props.name}>
      {props.items.map((item, index) => (
        <ButtonItem
          isSelected={
            props.selectedIndex !== undefined && props.selectedIndex === index
          } // This is needed to navigate with the keyboard
          iconBefore={item.icon}
          key={index}
          onClick={() => props.clickItem(item)}>
          {item.name}
        </ButtonItem>
      ))}
    </Section>
  );
}
