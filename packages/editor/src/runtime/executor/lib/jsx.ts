// @ts-expect-error
import { Fragment, jsx as _origJSX, jsxs } from "react/jsx-runtime";

function jsx(type: any, props: any, key: any) {
  return _origJSX(type, props, key);
}

export { Fragment, jsx, jsxs };
