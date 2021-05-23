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

function SuggestionContent<T extends SuggestionItem>(props: { item: T }) {
  return (
    <div className={styles.suggestionContent}>
      <div className={styles.buttonName}>{props.item.name}</div>
      <div className={styles.buttonHint}>{props.item.hint}</div>
    </div>
  );
}

export function SuggestionGroup<T extends SuggestionItem>(
  props: SuggestionGroupProps<T>
) {
  return (
    <Section title={props.name}>
      {props.items.map((item, index) => (
        <div className={styles.buttonItem}>
          <ButtonItem
            isSelected={
              props.selectedIndex !== undefined && props.selectedIndex === index
            } // This is needed to navigate with the keyboard
            iconBefore={item.icon}
            key={index}
            onClick={() => props.clickItem(item)}>
            <SuggestionContent item={item} />
          </ButtonItem>
        </div>
      ))}
    </Section>
  );
}
