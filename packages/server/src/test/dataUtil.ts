export function getRandomUserData(name: string) {
  return {
    email: `${name}-${Date.now() - Math.random()}@email.com`,
    password: `password-${name}`,
  };
}
