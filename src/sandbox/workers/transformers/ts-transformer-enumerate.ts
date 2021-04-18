// from https://github.com/kimamula/ts-transformer-enumerate
// TODO: - Check if we load "typescript" double, try to prevent this

// @ts-ignore
// import ts from "monaco-editor/esm/vs/language/typescript/lib/typescriptServices.js";

// NOTE: for this to work, typescript in package.json must be the same as in monaco-editor
import * as ts from "typescript";

export default function transformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext
): ts.SourceFile;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node | undefined;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node | undefined {
  return ts.visitEachChild(
    visitNode(node, program, context),
    (childNode) => visitNodeAndChildren(childNode, program, context),
    context
  );
}

function visitNode(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext
): ts.SourceFile;
function visitNode(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node | undefined;
function visitNode(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node | undefined {
  const typeChecker = program.getTypeChecker();
  if (isEnumerateImportExpression(node)) {
    return;
  }
  if (!isEnumerateCallExpression(node, typeChecker)) {
    return node;
  }
  const literals: string[] = [];
  node.typeArguments &&
    resolveStringLiteralTypes(
      typeChecker.getTypeFromTypeNode(node.typeArguments[0]),
      literals
    );

  return context.factory.createObjectLiteralExpression(
    literals.map((literal) =>
      context.factory.createPropertyAssignment(
        JSON.stringify(literal),
        context.factory.createStringLiteral(literal)
      )
    )
  );
}

// const indexJs = path.join(__dirname, "index.js");
function isEnumerateImportExpression(
  node: ts.Node
): node is ts.ImportDeclaration {
  if (!ts.isImportDeclaration(node)) {
    return false;
  }
  const module = (node.moduleSpecifier as ts.StringLiteral).text;
  try {
    return (
      module === "ts-transformer-enumerate" // TODO
      // indexJs ===
      // (module.startsWith(".")
      //   ? require.resolve(path.resolve(path.dirname(node.getSourceFile().fileName), module))
      //   : require.resolve(module))
    );
  } catch (e) {
    return false;
  }
}

function isEnumerateCallExpression(
  node: ts.Node,
  typeChecker: ts.TypeChecker
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const signature = typeChecker.getResolvedSignature(node);

  if (typeof signature === "undefined") {
    return false;
  }

  const { declaration } = signature;

  return (
    !!declaration &&
    !ts.isJSDocSignature(declaration) &&
    declaration.getSourceFile().fileName ===
      "transformers/ts-transformer-enumerate.d.ts" && // TODO
    !!declaration.name &&
    declaration.name.getText() === "enumerate"
  );
}

function resolveStringLiteralTypes(type: ts.Type, literals: string[]) {
  if (type.isUnion()) {
    type.types.forEach((type) => resolveStringLiteralTypes(type, literals));
  } else if (type.isStringLiteral()) {
    literals.push(type.value);
  }
}
