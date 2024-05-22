/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  BlockNoteEditor,
  BlockNoteSchema,
  createInternalBlockSpec,
  defaultBlockSpecs,
} from "@blocknote/core";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStronglyTypedTiptapNode } from "@blocknote/core";
import { mergeAttributes } from "@tiptap/core";
// import styles from "../../Block.module.css";

import * as parsers from "@typecell-org/parsers";
import { uniqueId } from "@typecell-org/util";
import * as Y from "yjs";

export function markdownToXmlFragment(
  markdown: string,
  fragment: Y.XmlFragment | undefined,
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

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      codeblock: MonacoCodeBlock,
      inlineCode: MonacoInlineCode,
    },
  });

  const editor = BlockNoteEditor.create({
    schema,
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

  const blocks = await editor.tryParseMarkdownToBlocks(markdown);
  // TODO: this should be possible without mounting (fix in blocknote)
  const div = document.createElement("div");
  editor.mount(div);

  return new Promise<Y.Doc>((resolve) => {
    queueMicrotask(() => {
      editor.replaceBlocks(editor.document, blocks);

      // markdownToXmlFragment(markdown, xml);

      if (title) {
        newDoc.getMap("meta").set("title", title);
        // newDoc.getText("title").delete(0, newDoc.getText("title").length);
        // newDoc.getText("title").insert(0, title);
      }

      // debugger;
      resolve(newDoc);
    });
  });
}

// hacky
const node = createStronglyTypedTiptapNode({
  name: "codeblock",
  content: "inline*",
  editable: true,
  group: "blockContent",

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
            "data-language": attributes.language,
          };
        },
      },
      storage: {
        default: {},
        parseHTML: (_element) => ({}),
        renderHTML: (attributes) => {
          return {
            // "data-language": attributes.language,
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

  // addNodeView: MonacoNodeView(false),
  // addProseMirrorPlugins() {
  //   return [arrowHandlers];
  // },
});

export const MonacoCodeBlock = createInternalBlockSpec(
  {
    type: "codeblock",
    content: "inline",

    propSchema: {
      language: {
        type: "string",
        default: "typescript",
      },
      storage: {
        type: "string",
        default: "",
      },
    },
  },
  {
    node,
    toExternalHTML: undefined as any, // TODO
    toInternalHTML: undefined as any,
  },
);

const nodeInline = createStronglyTypedTiptapNode({
  name: "inlineCode",
  inline: true,
  group: "inline",
  content: "inline*",
  editable: true,
  selectable: false,
  parseHTML() {
    return [
      {
        tag: "inlineCode",
        priority: 200,
        node: "inlineCode",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "inlineCode",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
      0,
    ];
  },

  // addNodeView: MonacoNodeView(true),
  // addProseMirrorPlugins() {
  //   return [arrowHandlers] as any;
  // },
});

// TODO: clean up listeners
export const MonacoInlineCode = createInternalBlockSpec(
  {
    content: "inline",
    type: "inlineCode",
    propSchema: {
      language: {
        type: "string",
        default: "typescript",
      },
      storage: {
        type: "string",
        default: "",
      },
    },
  },
  {
    node: nodeInline,
    toExternalHTML: undefined as any,
    toInternalHTML: undefined as any,
  },
);
