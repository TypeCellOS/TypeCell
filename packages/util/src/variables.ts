export function toCamelCaseVariableName(
  str: string,
  defaultName = "obj",
): string {
  const reservedWords = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "let",
    "enum",
    "await",
    "implements",
    "interface",
    "package",
    "protected",
    "static",
    "yield",
    "private",
    "public",
    "type",
  ];

  // Remove all non-alphanumeric characters and split by spaces or underscores
  const words = str.replace(/[^a-zA-Z0-9\s_]+/g, "").split(/[\s_]+/);

  // Convert to camelCase
  let camelCased = words
    .map((word, index) => {
      const lowerCased = word.toLowerCase();
      if (index === 0) {
        return lowerCased;
      }
      return lowerCased.charAt(0).toUpperCase() + lowerCased.slice(1);
    })
    .join("");

  // Remove leading numbers
  camelCased = camelCased.replace(/^[0-9]+/, "");

  if (camelCased === "") {
    camelCased = defaultName;
  }

  if (reservedWords.includes(camelCased)) {
    return "_" + camelCased;
  }

  return camelCased;
}
