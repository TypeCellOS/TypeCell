import { Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { __serializeForClipboard } from "prosemirror-view";
import { NodeSelection } from "prosemirror-state";
import styles from "./draggableBlocks.module.css";
export function createRect(rect: DOMRect) {
  let newRect = {
    left: rect.left + document.body.scrollLeft,
    top: rect.top + document.body.scrollTop,
    width: rect.width,
    height: rect.height,
    bottom: 0,
    right: 0,
  };
  newRect.bottom = newRect.top + newRect.height;
  newRect.right = newRect.left + newRect.width;
  return newRect;
}

export function absoluteRect(element: HTMLElement) {
  return createRect(element.getBoundingClientRect());
}

function blockPosAtCoords(
  coords: { left: number; top: number },
  view: EditorView
) {
  let node = getDraggableNodeFromCoords(coords, view);

  if (node && node.nodeType === 1) {
    // TODO: this uses undocumented PM APIs? do we need this / let's add docs?
    const docView = (view as any).docView;
    let desc = docView.nearestDesc(node, true);
    if (!desc || desc === docView) {
      return null;
    }
    return desc.posBefore;
  }
  return null;
}

function getDraggableNodeFromCoords(
  coords: { left: number; top: number },
  view: EditorView
) {
  let pos = view.posAtCoords(coords);
  if (!pos) {
    return undefined;
  }
  let node = view.domAtPos(pos.pos).node as HTMLElement;

  if (node === view.dom) {
    // mouse over root
    return undefined;
  }

  while (node && node.parentNode && node.parentNode !== view.dom) {
    node = node.parentNode as HTMLElement;
  }
  return node;
}

function dragStart(e: DragEvent, view: EditorView) {
  if (!e.dataTransfer) {
    return;
  }

  let coords = {
    left: view.dom.clientWidth / 2, // take middle of editor
    top: e.clientY,
  };
  let pos = blockPosAtCoords(coords, view);
  if (pos != null) {
    view.dispatch(
      view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
    );

    let slice = view.state.selection.content();
    let { dom, text } = __serializeForClipboard(view, slice);

    e.dataTransfer.clearData();
    e.dataTransfer.setData("text/html", dom.innerHTML);
    e.dataTransfer.setData("text/plain", text);

    view.dragging = { slice, move: true };
  }
}

export const CreateDraggableBlocksPlugin = () => {
  let dropElement: HTMLElement | undefined;

  const WIDTH = 24;

  return new Plugin({
    view(editorView) {
      dropElement = document.createElement("div");
      dropElement.setAttribute("draggable", "true");
      dropElement.className = styles.dragHandle;
      // dropElement.textContent = "⠿";
      document.body.appendChild(dropElement);

      dropElement.addEventListener("dragstart", (e) =>
        dragStart(e, editorView)
      );

      return {
        // update(view, prevState) {},
        destroy() {
          if (!dropElement) {
            throw new Error("unexpected");
          }
          dropElement.parentNode!.removeChild(dropElement);
          dropElement = undefined;
        },
      };
    },
    props: {
      //   handleDOMEvents: {
      //     dragend(view, event) {
      //       //   setTimeout(() => {
      //       //     let node = document.querySelector(".ProseMirror-hideselection");
      //       //     if (node) {
      //       //       node.classList.remove("ProseMirror-hideselection");
      //       //     }
      //       //   }, 50);
      //       return true;
      //     },
      handleKeyDown(view, event) {
        if (!dropElement) {
          throw new Error("unexpected");
        }
        dropElement.classList.add(styles.hidden);
        return false;
      },
      handleDOMEvents: {
        mouseleave(view, event) {
          if (!dropElement) {
            throw new Error("unexpected");
          }
          // TODO
          // dropElement.style.display = "none";
          return true;
        },
        mousemove(view, event) {
          if (!dropElement) {
            throw new Error("unexpected");
          }
          let coords = {
            left: view.dom.clientWidth / 2, // take middle of editor
            top: event.clientY,
          };
          const node = getDraggableNodeFromCoords(coords, view);

          if (!node) {
            dropElement.classList.add(styles.hidden);
            return true;
          }

          dropElement.classList.remove(styles.hidden);
          let rect = absoluteRect(node);
          let win = node.ownerDocument.defaultView!;
          rect.top += win.pageYOffset;
          rect.left += win.pageXOffset;
          //   rect.width = WIDTH + "px";

          dropElement.style.left = -WIDTH + rect.left + "px";
          dropElement.style.top = rect.top + "px";
          return true;
        },
      },
    },
  });
};
