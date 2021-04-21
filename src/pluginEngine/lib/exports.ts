import { runtimeStore } from "../../store/local/runtimeStore";

export default function getExposeGlobalVariables(
  id: string,
  addDispose: (disposer: () => void) => void
) {
  return {
    registerType: (type: { id: string; name: string }) => {
      if (
        !type.id ||
        !type.name ||
        typeof type.id !== "string" ||
        typeof type.name !== "string"
      ) {
        throw new Error("invalid args");
      }
      runtimeStore.resourceTypes.add(type);
      addDispose(() => {
        runtimeStore.resourceTypes.delete(type);
      });
    },
  };
}
