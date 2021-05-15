import BulletList from "@tiptap/extension-bullet-list";

// Extends bullet lists to make them draggable and give them drag handles.
const BulletListBlock = BulletList.extend({
  draggable: false,
  selectable: false,

  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  // addNodeView() {
  //   return ReactNodeViewRenderer(ChildBlock("ul"));
  // },
});

export default BulletListBlock;

{
  /* <ul>
  <li>
    <p>parent</p> --> plain blocks
    <ul>
      <li><p>child</p></li>
    </ul>
  </li>
</ul>

<div> // parent
  <p>parent</p>  --> plain blocks
  <div> // children
    <p>child</p>
  </div>
</div> */
}
