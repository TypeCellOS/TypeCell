// this file is used to make sure the cells compile by including the global $
import { IContext } from "./context";

declare global {
  /**
   * The context containing the exports of all cells
   */
  const $: IContext;
}
