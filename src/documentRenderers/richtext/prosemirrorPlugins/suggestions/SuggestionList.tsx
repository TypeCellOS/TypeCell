import React from "react";
import {
  SuggestionRendererKeyDownProps,
  SuggestionRendererProps,
} from "./SuggestionPlugin";
import "./SuggestionList.css";
import SuggestionItem from "./SuggestionItem";

export class SuggestionList<T extends SuggestionItem> extends React.Component<
  {
    items: T[];
    selectItemCallback: (item: T) => void;
  },
  { selectedIndex: number }
> {
  constructor(props: SuggestionRendererProps<T>) {
    super(props);

    this.state = {
      selectedIndex: 0,
    };
  }

  componentDidUpdate(oldProps: SuggestionRendererProps<T>) {
    // if the set of items is different, reset the selectedIndex to 0
    if (this.props.items !== oldProps.items) {
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

    return false;
  }

  upHandler() {
    this.setState({
      selectedIndex:
        (this.state.selectedIndex + this.props.items.length - 1) %
        this.props.items.length,
    });
  }

  downHandler() {
    this.setState({
      selectedIndex: (this.state.selectedIndex + 1) % this.props.items.length,
    });
  }

  enterHandler() {
    this.selectItem(this.state.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.props.items[index];

    if (item) {
      this.props.selectItemCallback(item);
    }
  }

  render() {
    return (
      <div className="items">
        {this.props.items.map((item, index) => (
          <button
            className={`item ${
              index === this.state.selectedIndex ? "is-selected" : ""
            }`}
            key={index}
            onClick={() => this.selectItem(index)}>
            {item.name}
          </button>
        ))}
      </div>
    );
  }
}
