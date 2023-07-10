export type Language = "typescript" | "css" | "markdown";
import { error } from "@typecell-org/util";

export type Document = {
  cells: Array<Cell>;
};

export type Cell = {
  language: Language;
  code: string;
  id?: string;
};

export type CellWithId = Cell & {
  id: string;
};

export function cellsWithId(cells: Cell[]) {
  return cells.map((cell, i) => {
    return {
      id: i + "",
      ...cell,
    };
  });
}

export function extensionForLanguage(lang: Language) {
  switch (lang) {
    case "typescript":
      return "tsx";
    case "css":
      return "css";
    case "markdown":
      return "md";
    default:
      throw new error.UnreachableCaseError(lang);
  }
}
