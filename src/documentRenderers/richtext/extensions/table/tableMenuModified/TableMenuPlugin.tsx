import { Editor, posToDOMRect } from "@tiptap/core";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import tippy, { Instance, Props } from "tippy.js";

// Code adapted from https://github.com/ueberdosis/tiptap/blob/7bf4c1d11ce4c36ad2846c4a15491ef8b649280d/packages/extension-bubble-menu/src/bubble-menu-plugin.ts
// This plugin is needed for the TableMenuExtension so that a slightly different Tippy menu could be rendered only for the table block.
export interface TableBubbleMenuPluginProps {
  editor: Editor;
  element: HTMLElement;
  tippyOptions?: Partial<Props>;
}

export type TableBubbleMenuViewProps = TableBubbleMenuPluginProps & {
  view: EditorView;
};

export class TableBubbleMenuView {
  public editor: Editor;

  public element: HTMLElement;

  public view: EditorView;

  public preventHide = false;

  public tippy!: Instance;

  constructor({
    editor,
    element,
    view,
    tippyOptions,
  }: TableBubbleMenuViewProps) {
    this.editor = editor;
    this.element = element;
    this.view = view;
    this.element.addEventListener("mousedown", this.mousedownHandler, {
      capture: true,
    });
    this.editor.on("focus", this.focusHandler);
    this.editor.on("blur", this.blurHandler);
    this.createTooltip(tippyOptions);
    this.element.style.visibility = "visible";
  }

  mousedownHandler = () => {
    this.preventHide = true;
  };

  focusHandler = () => {
    // we use `setTimeout` to make sure `selection` is already updated
    setTimeout(() => this.update(this.editor.view));
  };

  blurHandler = ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;

      return;
    }

    if (
      event?.relatedTarget &&
      this.element.parentNode?.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    this.hide();
  };

  // hide on click, no arrow shown
  createTooltip(options: Partial<Props> = {}) {
    this.tippy = tippy(this.view.dom, {
      arrow: false,
      getReferenceClientRect: null,
      content: this.element,
      interactive: true,
      trigger: "manual",
      placement: "top",
      hideOnClick: true,
      zIndex: 9999,
      ...options,
    });
  }

  update(view: EditorView, oldState?: EditorState) {
    const { state, composing } = view;
    const { doc, selection } = state;
    const isSame =
      oldState && oldState.doc.eq(doc) && oldState.selection.eq(selection);

    if (composing || isSame) {
      return;
    }

    const { from, to, empty } = selection;

    // When selection is empty, do not just hide it right away.
    if (empty) {
      const resolvedPos = doc.resolve(selection.from);
      // if the cursor is at top level, i.e., not inside a table node, hide it
      if (
        resolvedPos.depth === 1 ||
        !resolvedPos
          .node(resolvedPos.depth - 1)
          .type.name.toLowerCase()
          .startsWith("table")
      ) {
        this.hide();
        return;
      }
    }

    this.tippy.setProps({
      getReferenceClientRect: () => posToDOMRect(view, from, to),
    });

    this.show();
  }

  show() {
    this.tippy.show();
  }

  hide() {
    this.tippy.hide();
  }

  destroy() {
    this.tippy.destroy();
    this.element.removeEventListener("mousedown", this.mousedownHandler);
    this.editor.off("focus", this.focusHandler);
    this.editor.off("blur", this.blurHandler);
  }
}

export const TableBubbleMenuPluginKey = new PluginKey("tableMenuBubble");

export const TableBubbleMenuPlugin = (options: TableBubbleMenuPluginProps) => {
  return new Plugin({
    key: TableBubbleMenuPluginKey,
    view: (view) => new TableBubbleMenuView({ view, ...options }),
  });
};
