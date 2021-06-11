import { Editor as ReactEditor, ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";
import SuggestionItem from "./SuggestionItem";
import { SuggestionList, SuggestionListProps } from "./SuggestionList";
import { SuggestionRenderer } from "./SuggestionPlugin";

// If we do major work on this, consider exploring a cleaner approach: https://github.com/YousefED/typecell-next/issues/59
export default function createRenderer<T extends SuggestionItem>(
  editor: Editor
): SuggestionRenderer<T> {
  let component: ReactRenderer;
  let popup: any;
  let componentsDisposedOrDisposing = true;
  let selectedIndex = 0;

  return {
    onStart: (props) => {
      componentsDisposedOrDisposing = false;

      const componentProps: SuggestionListProps<T> = {
        groups: props.groups,
        count: props.count,
        selectItemCallback: props.selectItemCallback,
        selectedIndex,
        onClose: props.onClose,
      };

      component = new ReactRenderer(SuggestionList as any, {
        editor: editor as ReactEditor,
        props: componentProps,
      });
      props.decorationNode?.appendChild(component.element);
      console.log("rect", props.clientRect!());
      // popup = tippy("body", {
      //   getReferenceClientRect: props.clientRect,
      //   appendTo: () => document.body,
      //   content: component.element,
      //   showOnCreate: true,
      //   interactive: true,
      //   trigger: "manual",
      //   placement: "bottom-start",
      // });
    },

    onUpdate: (props) => {
      console.log("rect", props.clientRect!());
      const componentProps: SuggestionListProps<T> = {
        groups: props.groups,
        count: props.count,
        selectItemCallback: props.selectItemCallback,
        selectedIndex,
        onClose: props.onClose,
      };
      component.updateProps(componentProps);

      // popup[0].setProps({
      //   getReferenceClientRect: props.clientRect,
      // });
    },

    onKeyDown: (props) => {
      if (
        ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(props.event.key)
      ) {
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
