import { Editor as ReactEditor, ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";
import SuggestionItem from "./SuggestionItem";
import { SuggestionList, SuggestionListProps } from "./SuggestionList";
export interface SuggestionRenderer<T extends SuggestionItem> {
  onExit?: (props: SuggestionRendererProps<T>) => void;
  onUpdate?: (props: SuggestionRendererProps<T>) => void;
  onStart?: (props: SuggestionRendererProps<T>) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
  getComponent: () => Element;
}

export type SuggestionRendererProps<T extends SuggestionItem> = {
  editor: Editor;
  range: Range;
  query: string;
  groups: {
    [groupName: string]: T[];
  };
  count: number;
  selectItemCallback: (item: T) => void;
  decorationNode: Element | null;
  // virtual node for popper.js or tippy.js
  // this can be used for building popups without a DOM node
  clientRect: (() => DOMRect) | null;
  onClose: () => void;
};

// If we do major work on this, consider exploring a cleaner approach: https://github.com/YousefED/typecell-next/issues/59
export default function createRenderer<T extends SuggestionItem>(
  editor: Editor
): SuggestionRenderer<T> {
  let component: ReactRenderer;
  let popup: any;
  let componentsDisposedOrDisposing = true;
  let selectedIndex = 0;
  let props: SuggestionRendererProps<T> | undefined;

  const itemByIndex = (index: number): T => {
    if (!props) {
      throw new Error("props not set");
    }
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

  return {
    getComponent: () => {
      return component?.element;
    },
    onStart: (newProps) => {
      props = newProps;
      componentsDisposedOrDisposing = false;
      selectedIndex = 0;
      const componentProps: SuggestionListProps<T> = {
        groups: newProps.groups,
        count: newProps.count,
        selectItemCallback: newProps.selectItemCallback,
        selectedIndex,
      };

      component = new ReactRenderer(SuggestionList as any, {
        editor: editor as ReactEditor,
        props: componentProps,
      });

      popup = tippy("body", {
        getReferenceClientRect: newProps.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate: (newProps) => {
      props = newProps;
      if (props.groups !== component.props.groups) {
        // if the set of items is different (e.g.: by typing / searching), reset the selectedIndex to 0
        selectedIndex = 0;
      }
      const componentProps: SuggestionListProps<T> = {
        groups: props.groups,
        count: props.count,
        selectItemCallback: props.selectItemCallback,
        selectedIndex,
      };
      component.updateProps(componentProps);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown: (event) => {
      if (!props) {
        return false;
      }
      if (event.key === "ArrowUp") {
        selectedIndex = (selectedIndex + props.count - 1) % props.count;
        component.updateProps({
          selectedIndex,
        });
        return true;
      }

      if (event.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % props.count;
        component.updateProps({
          selectedIndex,
        });
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

    onExit: (props) => {
      if (componentsDisposedOrDisposing) {
        return;
      }
      // onExit, first hide tippy popup so it shows fade-out
      // then (after 1 second, actually destroy resources)
      componentsDisposedOrDisposing = true;
      const popupToDestroy = popup[0];
      const componentToDestroy = component;
      popupToDestroy.hide();
      setTimeout(() => {
        popupToDestroy.destroy();
        componentToDestroy.destroy();
      }, 1000);
    },
  };
}
