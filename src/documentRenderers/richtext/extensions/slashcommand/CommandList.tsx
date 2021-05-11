import React from "react";
import {
  SlashCommandRendererKeyDownProps,
  SlashCommandRendererProps,
} from "./SlashCommandPlugin";
import "./CommandList.css";
import { SlashCommand } from "./SlashCommand";

export class CommandList extends React.Component<
  {
    items: SlashCommand[];
    selectItemCallback: (command: SlashCommand) => void;
  },
  { selectedIndex: number }
> {
  constructor(props: SlashCommandRendererProps) {
    super(props);

    this.state = {
      selectedIndex: 0,
    };
  }

  componentDidUpdate(oldProps: SlashCommandRendererProps) {
    if (this.props.items !== oldProps.items) {
      this.setState({
        selectedIndex: 0,
      });
    }
  }

  onKeyDown({ event }: SlashCommandRendererKeyDownProps) {
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
    const command = this.props.items[index];

    if (command) {
      this.props.selectItemCallback(command);
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
