import speakingurl from "speakingurl";

export function slug(str: string) {
  return speakingurl(str, {
    // custom: {
    //   "@": "@", // TODO: necesary?
    // },
  });
}
