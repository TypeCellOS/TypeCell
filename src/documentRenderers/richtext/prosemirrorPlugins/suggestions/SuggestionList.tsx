import React from "react";
import SuggestionItem from "./SuggestionItem";
import { SuggestionGroup } from "./SuggestionGroup";
import styles from "../../SideMenu.module.css";
import { SuggestionRendererKeyDownProps } from "./SuggestionPlugin";
import { PopupMenuGroup, Section } from "@atlaskit/menu";
type SuggestionListProps<T> = {
  groups: {
    [groupName: string]: T[];
  };
  count: number;
  selectedIndex: number;
  selectItemCallback: (item: T) => void;
  onClose: () => void;
};

export class SuggestionList<T extends SuggestionItem> extends React.Component<
  SuggestionListProps<T>,
  { selectedIndex: number }
> {
  constructor(props: SuggestionListProps<T>) {
    super(props);

    this.state = {
      selectedIndex: 0,
    };
  }

  componentDidUpdate(oldProps: SuggestionListProps<T>) {
    // if the set of items is different, reset the selectedIndex to 0
    if (this.props.groups !== oldProps.groups) {
      this.setState({
        selectedIndex: 0,
      });
    }
  }

  onKeyDown({ event }: SuggestionRendererKeyDownProps) {
    if (event.key === "ArrowUp") {
      this.upHandler();
      return true;
    }

    if (event.key === "ArrowDown") {
      this.downHandler();
      return true;
    }

    if (event.key === "Enter") {
      this.enterHandler();
      return true;
    }

    if (event.key === "Escape") {
      this.escapeHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.setState({
      selectedIndex:
        (this.state.selectedIndex + this.props.count - 1) % this.props.count,
    });
  }

  downHandler() {
    this.setState({
      selectedIndex: (this.state.selectedIndex + 1) % this.props.count,
    });
  }

  enterHandler() {
    this.selectIndex(this.state.selectedIndex);
  }

  escapeHandler() {
    this.props.onClose();
  }

  private itemByIndex(index: number): T | undefined {
    let currentIndex = 0;
    for (const groupName in this.props.groups) {
      const items = this.props.groups[groupName];
      const groupSize = items.length;
      // Check if index lies within this group
      if (index < currentIndex + groupSize) {
        return items[index - currentIndex];
      }
      currentIndex += groupSize;
    }
  }

  selectIndex(index: number) {
    const item = this.itemByIndex(index);

    if (item) {
      this.props.selectItemCallback(item);
    }
  }

  render() {
    const renderedGroups = [];

    let currentGroupIndex = 0;

    for (const groupName in this.props.groups) {
      const items = this.props.groups[groupName];

      renderedGroups.push(
        <SuggestionGroup
          key={groupName}
          name={groupName}
          items={items}
          selectedIndex={
            this.state.selectedIndex >= currentGroupIndex
              ? this.state.selectedIndex - currentGroupIndex
              : undefined
          }
          clickItem={this.props.selectItemCallback}></SuggestionGroup>
      );

      currentGroupIndex += items.length;
    }

    return (
      <div className={styles.menuList}>
        <PopupMenuGroup maxWidth="250px" maxHeight="400px">
          {renderedGroups.length > 0 ? (
            renderedGroups
          ) : (
            <Section title={"No match found"}> </Section>
          )}
        </PopupMenuGroup>
      </div>
    );
  }
}
