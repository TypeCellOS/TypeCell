import { Section, ButtonItem } from "@atlaskit/menu";

import SuggestionItem from "./SuggestionItem";
import styles from "./SuggestionGroup.module.css";
import { SlashCommand } from "../../extensions/slashcommand/SlashCommand";

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
  return props.item instanceof SlashCommand ? (
    <div className={styles.suggestionWrapper}>
      <div>
        <div className={styles.buttonName}>{props.item.name}</div>
        <div className={styles.buttonHint}>{props.item.hint}</div>
      </div>
      {props.item.shortcut ? (
        <div>
          <div className={styles.buttonShortcut}>{props.item.shortcut}</div>
        </div>
      ) : (
        <></>
      )}
    </div>
  ) : (
    <div className={styles.buttonName}>{props.item.name}</div>
  );
}

function getIcon<T extends SuggestionItem>(
  item: T,
  isButtonSelected: boolean
): JSX.Element | undefined {
  const Icon = item.icon;
  return (
    Icon && ( // This is a null check
      <div className={styles.iconWrapper}>
        <Icon
          className={
            styles.icon + " " + (isButtonSelected ? styles.selectedIcon : "")
          }
        />
      </div>
    )
  );
}

export function SuggestionGroup<T extends SuggestionItem>(
  props: SuggestionGroupProps<T>
) {
  return (
    <Section title={props.name}>
      {props.items.map((item, index) => {
        let isButtonSelected =
          props.selectedIndex !== undefined && props.selectedIndex === index;
        return (
          <div className={styles.buttonItem}>
            <ButtonItem
              isSelected={isButtonSelected} // This is needed to navigate with the keyboard
              iconBefore={getIcon(item, isButtonSelected)}
              key={index}
              onClick={() => props.clickItem(item)}>
              <SuggestionContent item={item} />
            </ButtonItem>
          </div>
        );
      })}
    </Section>
  );
}
