// TODO: make sure only relevant types are exported
export function getExposeGlobalVariables(id: string) {
  return {
    plugins: {
      registerType: (type: string) => {},
    },
  };
}
