# packages/parsers

Helper functions to convert to and from different file formats, exported as `@typecell-org/parsers`.

## TypeCell document format

A TypeCell document is represented like an array of cells:

```typescript
export type Document = {
  cells: Array<Cell>;
};

export type Cell = {
  language: Language;
  code: string;
  id?: string;
};
```

## Markdown parser

The Markdown parser can read Markdown files and convert this to the TypeCell document format, or export from TypeCell to Markdown.

Let's say we have the following `.md` file:

<pre>
# Title

This is an example introductory paragraph. Below is a live-code TypeCell cell:

```typescript
export let str = "hello world";
```
</pre>

The markdown parser would parse this to a document containing two cells:

- one cell with `language: "markdown"` (containing the title and first paragraph).
- and one cell with `language: "typescript"` containing the typescript code.
