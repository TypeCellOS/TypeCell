import { Link } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import Tippy from "@tippyjs/react";
import tippy from "tippy.js";
import ReactDOM from "react-dom";
import "./Link.module.css";

const linkEditMenu = (target: Element) => {
  return (
    <Tippy content={"hello!!!!????!?!?!?"}>
      <span>target</span>
    </Tippy>
  );
};

const floater = (removeHandler: () => void) => {
  const div = document.createElement("div");
  div.setAttribute("id", "linker");
  div.style.zIndex = "9999";
  div.style.display = "none";
  const edit = document.createElement("button");
  edit.innerHTML = "edit";
  edit.addEventListener("click", (ev) => {
    window.alert("clicked");
  });
  const open = document.createElement("button");
  open.innerHTML = "open";
  const remove = document.createElement("button");
  remove.innerHTML = "remove";
  remove.addEventListener("click", removeHandler);

  div.appendChild(edit);
  div.appendChild(remove);

  const parent = document.querySelector(".ProseMirror.editor")?.parentElement;
  parent?.append(div);

  return div;
};

const clearLinker = () => {
  const menu = document.getElementById("linker");
  if (menu) menu.remove();
};

const generateTippyEditor = (
  editHandler: (href: string) => void,
  pre?: string
) => {
  const editingDiv = document.createElement("div");
  const input = document.createElement("input");
  input.type = "text";
  input.value = pre ?? "";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.innerHTML = "OK";
  submit.addEventListener("click", (ev) => {
    ev.preventDefault();
    const val = submit.previousElementSibling;
    if (val instanceof HTMLInputElement) {
      const value = val.value;
      editHandler("//" + value);
    }
  });
  editingDiv.appendChild(input);
  editingDiv.appendChild(submit);
  editingDiv.style.width = "fit-content";

  return editingDiv;
};

const CustomLink = Link.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customLinkMark"),
        props: {
          handleClick: (view, pos, event) => {
            clearLinker();
            return true;
          },
          handleDOMEvents: {
            mouseover: (view, event) => {
              const anchor = event.target;
              if (
                anchor &&
                anchor instanceof Element &&
                anchor.nodeName === "A"
              ) {
                clearLinker();
                const from = view.posAtDOM(anchor, -1);
                const to = from + anchor.innerHTML.length;
                this.editor
                  .chain()
                  .focus()
                  .setTextSelection({ from, to })
                  .run();

                const removeHandler = () => {
                  this.editor.chain().focus().unsetLink().run();
                };
                const editHandler = (href: string) => {
                  this.editor.chain().focus().setLink({ href }).run();
                };

                const menu = floater(removeHandler);
                const editButton = menu.firstElementChild;
                if (editButton instanceof HTMLButtonElement) {
                  editButton.addEventListener(
                    "mouseenter",
                    (ev) => {
                      const tip = tippy(editButton, {
                        content: generateTippyEditor(editHandler),
                        placement: "top",
                        interactive: true,
                      });
                      tip.show();
                    },
                    { once: true }
                  );
                }
                // --------------showing the 3 buttons------------
                const rect = anchor.getBoundingClientRect();
                menu.style.display = "block";
                menu.style.position = "absolute";
                menu.style.width = "5em";
                menu.style.left = `${
                  rect.left - menu.scrollWidth / 2 + rect.width / 2
                }px `;
                menu.style.top = `${
                  window.pageYOffset + rect.top - 2 * menu.scrollHeight
                }px`;
                // ---------------showing the 3 buttons------------------

                /*
                this below will add content text into the tiptap paragraph!!!??!?
                const tip = tippy("a", {
                  content: "hello", //menu,
                  interactive: true,
                  allowHTML: true,
                });
                tip.show();
                This will replace the entire contnet with menu!
                ReactDOM.render(menu, document.getElementById("root"));
                */
                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default CustomLink;
