/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Operation to the document
 *
 * Block Id `id` parameters MUST be part of the document the user is editing (NOT a block from an imported library)
 */
export type BlockOperation =
  | {
      type: "delete";
      id: string;
    }
  | {
      type: "update";
      id: string;
      content: string;
    }
  | {
      afterId: string;
      type: "add";
      content: string;
      blockType: "codeblock" | "paragraph" | "heading";
    };

export type OperationsResponse = BlockOperation[];

export const OUTPUT_TYPES = `/**
* Operation to the document
*
* Block Id \`id\` parameters MUST be part of the document the user is editing (NOT a block from an imported library)
*/
type BlockOperation =
 | {
     type: "delete";
     id: string;
   }
 | {
     type: "update";
     id: string;
     content: string;
   }
 | {
     afterId: string;
     type: "add";
     content: string;
     blockType: "codeblock" | "paragraph" | "heading";
   };

type response = BlockOperation[];`;

type Block = {
  id: string;
  type: "paragraph" | "heading" | "codeblock";
  content?: string;
  children?: Block[];
};

export type Document = Block[];

/**
 * Runtime information about a code block of the main document
 * The code itself is not included (it's in the Block.id with the corresponding blockId)
 */
type MainCodeBlockRuntimeInfo = {
  imported: false;
  blockId: string;
  // .d.ts TypeScript types of values exported by this block
  types: string;
  // the runtime values exported by this block. Data can be trimmed for brevity
  data: any;
};

/**
 * Runtime + code information of code blocks imported from other documents
 */
type ImportedCodeBlockRuntimeInfo = {
  imported: true;
  /**
   * Because we don't pass the entire document this code is imported from, we need to pass the code of this code block
   */
  code: string;
  // .d.ts TypeScript types of values exported by this block
  types: string;
  documentId: string;
  blockId: string;
  // the runtime values exported by this block. Data can be trimmed for brevity
  data: any;
};

export type CodeBlockRuntimeInfo =
  | MainCodeBlockRuntimeInfo
  | ImportedCodeBlockRuntimeInfo;
