import {
  BlockNoteEditor,
  createTipTapBlock,
  defaultBlockSchema,
} from "@blocknote/core";
import { mergeAttributes } from "@tiptap/core";
import * as parsers from "@typecell-org/parsers";
import { uniqueId } from "@typecell-org/util";
import * as Y from "yjs";

export function markdownToXmlFragment(
  markdown: string,
  fragment: Y.XmlFragment | undefined
) {
  if (!fragment) {
    const containerDoc = new Y.Doc(); // the doc is needed because otherwise the fragment doesn't work
    fragment = containerDoc.getXmlFragment("doc");
  }
  const nbData = parsers.markdownToDocument(markdown);

  const elements = nbData.cells.map((cell) => {
    const element = new Y.XmlElement("typecell");
    element.setAttribute("block-id", uniqueId.generateId("block")); // TODO: do we want random blockids? for markdown sources?

    if (cell.language === "markdown") {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", "markdown");
    } else {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", cell.language);
    }

    return element;
  });
  fragment.insert(0, elements);
  return fragment;
}

export async function markdownToYDoc(markdown: string, title?: string) {
  const newDoc = new Y.Doc();
  newDoc.getMap("meta").set("type", "!richtext");

  const xml = newDoc.getXmlFragment("doc");

  const editor = new BlockNoteEditor({
    blockSchema: {
      ...defaultBlockSchema,
      codeblock: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
        },
        node: MonacoBlockContent,
      },
    },
    collaboration: {
      fragment: xml,
      provider: undefined as any,
      user: undefined as any,
    },
    initialContent: [
      {
        id: "sdfsdf",
        type: "paragraph",
      },
    ],
  });

  const blocks = await editor.markdownToBlocks(markdown);

  editor.replaceBlocks(editor.topLevelBlocks, blocks);

  // markdownToXmlFragment(markdown, xml);

  if (title) {
    newDoc.getMap("meta").set("title", title);
    // newDoc.getText("title").delete(0, newDoc.getText("title").length);
    // newDoc.getText("title").insert(0, title);
  }

  // debugger;
  return newDoc;
}

// hacky
export const MonacoBlockContent = createTipTapBlock({
  name: "codeblock",
  content: "inline*",
  editable: true,
  selectable: true,
  whitespace: "pre",
  code: true,

  addAttributes() {
    return {
      language: {
        default: "typescript",
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => {
          return {
            "data-language": attributes.level,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "code",
        priority: 200,
        node: "codeblock",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "code",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
    ];
  },
});
