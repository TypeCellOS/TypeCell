import { getNotebook } from "./notebook";
export function setup() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Vite + TypeScript</h1>

    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;
}
setup();

(window as any).nb = getNotebook();
