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
    <div className={styles.itemGroup}>
      <div className={styles.groupName}>{props.name}</div>
      <div className={styles.items}>
        {props.items.map((item, index) => (
          <button
            className={`${styles.item} ${
              props.selectedIndex !== undefined
                ? props.selectedIndex === index
                  ? styles.isSelected
                  : ""
                : ""
            }`}
            key={index}
            onClick={() => props.clickItem(item)}>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
