import { runtimeStore } from "../../store/local/runtimeStore";
import { strings } from "vscode-lib";

export default function getExposeGlobalVariables(
  id: string,
  addDispose: (disposer: () => void) => void
) {
  return {
    registerType: (type: { id: string; name: string }) => {
      if (
        strings.isFalsyOrWhitespace(type.id) ||
        strings.isFalsyOrWhitespace(type.name)
      ) {
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
        strings.isFalsyOrWhitespace(renderer.type) ||
        strings.isFalsyOrWhitespace(renderer.rendererId) ||
        strings.isFalsyOrWhitespace(renderer.variable) ||
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
