/* eslint-disable @typescript-eslint/no-explicit-any */
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";
import * as mobx from "mobx";
import * as monaco from "monaco-editor";
import type openai from "openai";

import { BlockNoteEditor } from "@blocknote/core";
import { HostBridgeMethods } from "@typecell-org/shared";
import { uri } from "vscode-lib";
import { EditorStore } from "../EditorStore";
import { ExecutionHost } from "../runtime/executor/executionHosts/ExecutionHost";
import { trimmedStringify } from "./trimmedStringify";

const TYPECELL_PROMPT = `
You're a smart AI assistant for TypeCell: a rich text document tool that also supports interactive Code Blocks written in Typescript. 

TypeCell Documents look like this:
- Documents consists of a list of blocks (e.g.: headings, paragraphs, code blocks), Notion style. Code Blocks are unique to TypeCell and execute live, as-you type.

TypeCell Code Blocks works as follows:
- Code Blocks can export variables using the javascript / typescript \`export\` syntax. These variables are shown as the output of the cell.
- The exported variables by a Code Block are available in other cells, under the \`$\` variable. e.g.: \`$.exportedVariableFromOtherCell\`
- Different cells MUST NOT output variables with the same name, because then they would collide under the \`$\` variable.
- When the exports of one Code Block change, other cells that depend on those exports, update live, automatically.
- React / JSX components will be displayed automatically. E.g.: \`export let component = <div>hello world</div>\` will display a div with hello world.
- Note that exported functions are not called automatically. They'll simply become a callable variable under the $ scope. This means simply exporting a function and not calling it anywhere is not helpful

Example document:

[
  {
    id: "block-1",
    type: "codeblock",
    content: "export let name = 'James';",
  },
  {
    id: "block-2",
    type: "codeblock",
    content: "export let nameLength = $.name.length; // updates reactively based on the $.name export from block-1",
  },
  {
    id: "block-3",
    type: "codeblock",
    content: "// This uses the exported \`name\` from code block 1, using the TypeCell \`$.name\` syntax, and shows the capitalized name using React
    export let capitalized = <div>{$.name.toUpperCase()}</div>",
  }
]

The runtime data of this would be: 

{ name: "James", nameLength: 5, capitalized: "[REACTELEMENT]"}

This is the type of a document:

type Block = {
  id: string;
  type: "paragraph" | "heading" | "codeblock";
  content?: string;
  children?: Block[];
};

export type Document = Block[];

Example prompts:
- If the user would ask you to update the name in the document, you would issue an Update operation to block-1.
- If the user would ask you to add a button to prompt for a name, you would issue an Add operation for a new codeblock with code \`export default <button onClick={() => $.name = prompt('what's your name?'}>Change name</button>\`
- If the user would ask you to output the name in reverse, you would issue an Add operation with code \`export let reverseName = $.name.split('').reverse().join('');\`

NEVER write code that depends on and updates the same variable, as that would cause a loop. You can directly modify (mutate) variables. So don't do this:

$.complexObject = { ...$.complexObject, newProperty: 5 };

but instead:

$.complexObject.newProperty = 5;
`;

export async function getAICode(
  prompt: string,
  executionHost: ExecutionHost,
  editor: BlockNoteEditor<any>,
  editorStore: EditorStore,
  queryLLM: HostBridgeMethods["queryLLM"],
) {
  const blocks = editor.topLevelBlocks;

  let blockContexts: any[] = [];
  const iterateBlocks = (blocks: any[]) => {
    for (const block of blocks) {
      const b = editorStore.getBlock(block.id);
      if (b?.context?.default) {
        blockContexts.push(b.context.default);
      }
      iterateBlocks(block.children);
    }
  };
  iterateBlocks(blocks);

  blockContexts = blockContexts.map((output) =>
    Object.fromEntries(
      Object.getOwnPropertyNames(output).map((key) => [
        key,
        mobx.toJS(output[key]),
      ]),
    ),
  );

  const tmpModel = monaco.editor.createModel(
    "",
    "typescript",
    uri.URI.parse("file:///tmp.tsx"),
  );
  tmpModel.setValue(`import * as React from "react";
  import * as $ from "!typecell:typecell.org/dVeeYvbKcq2Nz";
  // expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] extends { Key: React.Key | null } ? "[REACT]" : O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends (...args: any[]) => any
    ? T
    : T extends infer O
    ? {
        [K in keyof O]: O[K] extends { key: React.Key }
          ? "[REACT ELEMENT]"
          : ExpandRecursively<O[K]>;
      }
    : never
  : T;
  
  // ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  type ContextType = ExpandRecursively<typeof $>;`);

  const worker = await monaco.languages.typescript.getTypeScriptWorker();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ts = (await worker(tmpModel.uri))!;
  const pos =
    tmpModel.getValue().length - "pe = ExpandRecursively<typeof $>;".length;
  // const def = await ts.getDefinitionAtPosition(tmpModel.uri.toString(), pos);
  const def2 = await ts.getQuickInfoAtPosition(tmpModel.uri.toString(), pos);
  const contextType = def2.displayParts.map((x: any) => x.text).join("");
  // const def3 = await ts.get(tmpModel.uri.toString(), pos, {});
  tmpModel.dispose();

  /*
  // const models = monaco.editor.getModels();
  // const typeCellModels = models.filter((m) =>
  //   m.uri.path.startsWith("/!typecell:typecell.org"),
  // );

  
  const codeInfoPromises = typeCellModels.map(async (m) => {
    const code = await compile(m, monaco);
    const output = await executionHost.outputs.get(m.uri.toString())?.value;

    let data: any;
    if (output) {
      const outputJS = Object.fromEntries(
        Object.getOwnPropertyNames(output).map((key) => [
          key,
          mobx.toJS(output[key]),
        ]),
      );
      data = JSON.parse(customStringify(outputJS));
      // console.log(data);
    }
    const path = m.uri.path.split("/"); // /!typecell:typecell.org/dVVAYmvBaeQdE/c58863ef-2f82-4fd7-ab0c-f1f760eb9578.cell.tsx"
    const blockId = path[path.length - 1].replace(".cell.tsx", "");
    const imported = !blocks.find((b) => b.id === blockId);

    const ret: CodeBlockRuntimeInfo = {
      // code: imported ? m.getValue() : undefined,
      types: code.types,
      blockId,
      data,
      ...(imported
        ? { documentId: path[path.length - 2]!, imported, code: m.getValue() }
        : { imported }),
    };
    return ret;
  });
  let codeInfos = await Promise.all(codeInfoPromises);
  codeInfos = codeInfos.filter((x) => !!x.imported);*/

  const context = executionHost.engine.observableContext.rawContext as any;

  let outputJS = Object.fromEntries(
    Object.getOwnPropertyNames(context).map((key) => [
      key,
      mobx.toJS(context[key]),
    ]),
  );
  outputJS = JSON.parse(trimmedStringify(outputJS));

  function cleanBlock(block: any) {
    if (!block.content?.length && !block.children?.length) {
      return undefined;
    }
    delete block.props;
    if (block.children) {
      block.children = block.children.map(cleanBlock);
    }
    if (Array.isArray(block.content)) {
      block.content = block.content.map((x: any) => x.text).join("");
    }
    return block;
  }

  const sanitized = blocks.map(cleanBlock).filter((x) => !!x);
  const contextInfo =
    contextType.replace("type ContextType = ", "const $: ") +
    " = " +
    JSON.stringify(outputJS);

  const blockContextInfo = blockContexts.length
    ? `typecell.editor.findBlocks = (predicate: (context) => boolean) {
        return (${JSON.stringify(blockContexts)}).find(predicate);
    }`
    : undefined;

  const messages: openai.Chat.ChatCompletionCreateParams["messages"] = [
    {
      role: "system",
      content: TYPECELL_PROMPT,
    },
    {
      role: "user",
      content: `This is my document data: 
"""${JSON.stringify(sanitized)}"""`,
    },
    {
      role: "user",
      content:
        "This is the type and runtime data available under the reactive $ variable for read / write access. If you need to change / read some information from the live document, it's likely you need to access it from here using $.<variable name> \n" +
        contextInfo +
        (blockContextInfo
          ? "\n" +
            `We also have this function "typecell.editor.findBlocks" to extract runtime data from blocks \n` +
            blockContextInfo
          : ""),
    },
    {
      role: "system",
      content: `You are an AI assistant helping user to modify his document. This means changes can either be code related (in that case, you'll need to add / modify Code Blocks), 
        or not at all (in which case you'll need to add / modify regular blocks), or a mix of both.`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await queryLLM({
    messages,
    functions: [
      {
        name: "updateDocument",
        description: "Update the document with operations",
        parameters: {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          required: ["operations"],
          properties: {
            operations: {
              type: "array",
              items: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      explanation: {
                        type: "string",
                        description:
                          "explanation of why this block was deleted (your reasoning as AI agent)",
                      },
                      type: {
                        type: "string",
                        enum: ["delete"],
                        description:
                          "Operation to delete a block in the document",
                      },
                      id: {
                        type: "string",
                        description: "id of block to delete",
                      },
                    },
                    required: ["type", "id"],
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    properties: {
                      explanation: {
                        type: "string",
                        description:
                          "explanation of why this block was updated (your reasoning as AI agent)",
                      },
                      type: {
                        type: "string",
                        enum: ["update"],
                        description:
                          "Operation to update a block in the document",
                      },
                      id: {
                        type: "string",
                        description: "id of block to delete",
                      },
                      content: {
                        type: "string",
                        description: "new content of block",
                      },
                    },
                    required: ["type", "id", "content"],
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    properties: {
                      explanation: {
                        type: "string",
                        description:
                          "explanation of why this block was added (your reasoning as AI agent)",
                      },
                      type: {
                        type: "string",
                        enum: ["add"],
                        description:
                          "Operation to insert a new block in the document",
                      },
                      afterId: {
                        type: "string",
                        description:
                          "id of block after which to insert a new block in the document",
                      },
                      content: {
                        type: "string",
                        description: "content of new block",
                      },
                      blockType: {
                        type: "string",
                        enum: ["codeblock", "paragraph", "heading"],
                        description: "type of new block",
                      },
                    },
                    required: ["afterId", "type", "content", "blockType"],
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
      },
    ],
    function_call: {
      name: "updateDocument",
    },
  });

  console.log(messages);

  if (response.status === "ok") {
    const data = JSON.parse(response.result);
    return JSON.parse(data.function_call.arguments).operations;
  } else {
    console.error("queryLLM error", response.error);
  }
  return undefined;
}
