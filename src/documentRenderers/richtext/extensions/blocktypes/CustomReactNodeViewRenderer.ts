import { ReactNodeViewRenderer } from "@tiptap/react";

export function CustomReactNodeViewRenderer(component: any, options?: any) {
  return (props: any) => {
    const renderer = ReactNodeViewRenderer(component, options)(props) as any;
    const oldUpdate = renderer.update;
    if (oldUpdate) {
      renderer.update = function () {
        let ret = oldUpdate.apply(this, arguments);
        this.contentDOM; // trigger fix
        return ret;
      };
    }
    return renderer;
  };
}
