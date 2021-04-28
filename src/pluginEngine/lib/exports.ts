import { runtimeStore } from "../../store/local/runtimeStore";
import { isFalsyOrWhitespace } from "../../util/vscode-common/strings";

export default function getExposeGlobalVariables(
  id: string,
  addDispose: (disposer: () => void) => void
) {
  return {
    registerType: (type: { id: string; name: string }) => {
      if (isFalsyOrWhitespace(type.id) || isFalsyOrWhitespace(type.name)) {
        throw new Error("invalid args");
      }
      runtimeStore.resourceTypes.add(type);
      addDispose(() => {
        runtimeStore.resourceTypes.delete(type);
      });
    },
    registerRenderer: (renderer: {
      type: string;
      rendererId: string;
      variable: string;
    }) => {
      if (
        isFalsyOrWhitespace(renderer.type) ||
        isFalsyOrWhitespace(renderer.rendererId) ||
        isFalsyOrWhitespace(renderer.variable) ||
        !renderer.rendererId.startsWith("@") // TODO
      ) {
        throw new Error("invalid args");
      }
      runtimeStore.customRenderers.set(renderer.type, renderer);
      addDispose(() => {
        runtimeStore.customRenderers.delete(renderer.type);
      });
    },
  };
}
