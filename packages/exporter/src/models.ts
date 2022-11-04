export type Language = "typescript" | "css" | "markdown";

export type Document = {
  cells: Array<Cell>;
};

export type Cell = {
  language: Language;
  code: string;
  id?: string;
};
