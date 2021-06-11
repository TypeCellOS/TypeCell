import React, { useCallback, useState } from "react";
import SuggestionItem from "./SuggestionItem";
import { SuggestionGroup } from "./SuggestionGroup";
import styles from "../../menus/SideMenu.module.css";
import { SuggestionRendererKeyDownProps } from "./SuggestionPlugin";
import { PopupMenuGroup, Section } from "@atlaskit/menu";
import Tippy from "@tippyjs/react";
export type SuggestionListProps<T> = {
  groups: {
    [groupName: string]: T[];
  };
  count: number;
  selectItemCallback: (item: T) => void;
  // moveUp: () => void;
  // moveDown: () => void;
  onClose: () => void;
  selectedIndex: number;
};
/**
 *
 *
 * @export
 * @template T
 * @param {SuggestionListProps<T>} props
 * @returns
 */
export function SuggestionList<T extends SuggestionItem>(
  props: SuggestionListProps<T>
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.count - 1) % props.count);
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.count);
        return true;
      }

      if (event.key === "Enter") {
        const item = itemByIndex(selectedIndex);
        props.selectItemCallback(item);
        return true;
      }

      if (event.key === "Escape") {
        props.onClose();
        return true;
      }

      return false;
    },
    [props.onClose, props.count, selectedIndex]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const itemByIndex = (index: number): T => {
    let currentIndex = 0;
    for (const groupName in props.groups) {
      const items = props.groups[groupName];
      const groupSize = items.length;
      // Check if index lies within this group
      if (index < currentIndex + groupSize) {
        return items[index - currentIndex];
      }
      currentIndex += groupSize;
    }
    throw Error("item not found");
  };

  const renderedGroups = [];

  let currentGroupIndex = 0;

  for (const groupName in props.groups) {
    const items = props.groups[groupName];

    renderedGroups.push(
      <SuggestionGroup
        key={groupName}
        name={groupName}
        items={items}
        selectedIndex={
          selectedIndex >= currentGroupIndex
            ? selectedIndex - currentGroupIndex
            : undefined
        }
        clickItem={props.selectItemCallback}></SuggestionGroup>
    );

    currentGroupIndex += items.length;
  }

  return (
    // doesn't work well yet, maybe https://github.com/atomiks/tippyjs-react/issues/173
    <Tippy
      visible={true}
      placement="bottom-start"
      content={
        <div className={styles.menuList}>
          <PopupMenuGroup maxWidth="250px" maxHeight="400px">
            {renderedGroups.length > 0 ? (
              renderedGroups
            ) : (
              <Section title={"No match found"}> </Section>
            )}
          </PopupMenuGroup>
        </div>
      }
      interactive={false}>
      <div></div>
    </Tippy>
  );
}
