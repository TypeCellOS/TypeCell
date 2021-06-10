// import { Node, mergeAttributes, Command } from "@tiptap/core";

// export interface CollapseHiddenOptions {
//   HTMLAttributes: Record<string, any>;
// }
// type CommandAttributes = { [key: string]: any };

// declare module "@tiptap/core" {
//   interface Commands {
//     collapseHidden: {
//       /**
//        * Set a heading node
//        */
//       setCollapse: (attributes: CommandAttributes) => Command;
//       /**
//        * Toggle a heading node
//        */
//       toggleCollapse: (attributes: CommandAttributes) => Command;
//     };
//   }
// }

// export const CollapseHidden = Node.create<CollapseHiddenOptions>({
//   name: "collapseHidden",

//   defaultOptions: {
//     HTMLAttributes: {},
//   },

//   content: "block*",

//   defining: true,

//   parseHTML() {
//     return [
//       {
//         tag: "hidden",
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return [
//       "hidden",
//       mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
//       0,
//     ];
//   },

//   addCommands() {
//     return {
//       setCollapse:
//         (attributes) =>
//         ({ commands }) => {
//           return commands.setNode("collapseHidden", attributes);
//         },
//       toggleCollapse:
//         (attributes) =>
//         ({ commands }) => {
//           return commands.toggleNode(
//             "collapseHidden",
//             "collapseShown",
//             attributes
//           );
//         },
//     };
//   },
// });

export {};
