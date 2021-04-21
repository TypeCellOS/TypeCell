import { runtimeStore } from "../../store/local/runtimeStore";

function checkNotEmptyString(val: string) {
  return val && typeof val === "string";
}
export default function getExposeGlobalVariables(
  id: string,
  addDispose: (disposer: () => void) => void
) {
  return {
    registerType: (type: { id: string; name: string }) => {
      if (!checkNotEmptyString(type.id) || !checkNotEmptyString(type.name)) {
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
        !checkNotEmptyString(renderer.type) ||
        !checkNotEmptyString(renderer.rendererId) ||
        !checkNotEmptyString(renderer.variable) ||
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
