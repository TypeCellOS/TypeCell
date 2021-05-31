import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import lowlight from "lowlight";
import { extendAsBlock } from ".";
import "./CodeBlockBlock.module.css";

export const CodeBlockBlock = extendAsBlock(CodeBlockLowlight).configure({
  lowlight,
});
