import Paragraph from "@tiptap/extension-paragraph";

// A non-draggable paragraph, to appear in nested elements
const ParagraphPlainBlock = Paragraph.extend({
  name: "paragraphplain",
  group: "plainblock",

  draggable: false,
  selectable: false,
});

export default ParagraphPlainBlock;
