import {
  BlockColorsButton,
  DragHandleMenu,
  DragHandleMenuItem,
  DragHandleMenuProps,
  RemoveBlockButton,
} from "@blocknote/react";

export function CustomDragHandleMenu(props: DragHandleMenuProps<any>) {
  return (
    <DragHandleMenu {...props}>
      <DragHandleMenuItem
        closeMenu={props.closeMenu}
        onClick={() => props.editor.removeBlocks([props.block])}>
        Configure
      </DragHandleMenuItem>
      <RemoveBlockButton {...props}>Delete</RemoveBlockButton>
      <BlockColorsButton {...props}>Colors</BlockColorsButton>
    </DragHandleMenu>
  );
}
