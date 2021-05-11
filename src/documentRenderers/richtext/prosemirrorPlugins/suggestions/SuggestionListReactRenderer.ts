import { Editor as ReactEditor, ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";
import SuggestionItem from "./SuggestionItem";
import { SuggestionList } from "./SuggestionList";
import { SuggestionRenderer } from "./SuggestionPlugin";

export default function createRenderer<T extends SuggestionItem>(
  editor: Editor
): SuggestionRenderer<T> {
  let component: ReactRenderer;
  let popup: any;

  return {
    onStart: (props) => {
      component = new ReactRenderer(SuggestionList as any, {
        editor: editor as ReactEditor,
        props: {
          groups: props.groups,
          count: props.count,
          selectItemCallback: props.selectItemCallback,
        },
      });

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate: (props) => {
      component.updateProps(props);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown: (props) => {
      if (!component.ref) return false;
      return (component.ref as SuggestionList<T>).onKeyDown(props);
    },

    onExit: (props) => {
      popup[0].destroy();
      component.destroy();
    },
  };
}
