export function getRandomUserData(basename: string) {
  const randomID = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substring(0, 5);

  const name = basename + "_" + randomID;
  return {
    email: `${name}@email.com`,
    password: `password-${name}`,
    name,
  };
}
