import JSON5 from "json5";
import * as tgen from "ts-json-schema-generator";
import type * as ts from "typescript";

export interface TransformerOptions {
  env: { [key: string]: string };
}
// let ts: any = {};

// let JSON5: any = {};
export interface Options {
  /**
   * Prefix of generated names (e.g. '__private__')
   */
  //   prefix: string;
}

const defaultOptions: Options = {
  //   prefix: "_private_",
};

const tsObj = (globalThis as any).ts as typeof import("typescript");

export class Transformer {
  private readonly context: ts.TransformationContext;
  private readonly options: Options;

  public constructor(
    context: ts.TransformationContext,
    options?: Partial<Options>
  ) {
    this.context = context;
    this.options = { ...defaultOptions, ...options };
  }

  public visitSourceFile(
    node: ts.SourceFile,
    program: ts.Program
  ): ts.SourceFile {
    const result = this.visitNodeAndChildren(node, program);
    return result;
  }

  private getVisitor(program: ts.Program) {
    const typeChecker = program.getTypeChecker();
    const visitor: ts.Visitor = (
      node: ts.Node
    ): ts.VisitResult<ts.Node | undefined> => {
      console.log(
        "VISIT",
        tsObj.versionMajorMinor,
        node,
        tsObj.SyntaxKind[node.kind]
      );
      if (tsObj.isCallExpression(node)) {
        if (
          typeof node.typeArguments === "undefined" ||
          node.typeArguments.length === 0
        ) {
          return node;
        }

        // const signature = typeChecker.getResolvedSignature(node);

        if (node.expression.getText() === "JsonSchema.fromType") {
          // if (signature !== undefined && signature.declaration !== undefined) {
          // const sourceName = signature.declaration.getSourceFile().fileName;

          // if (!sourceName.includes("ts-transform-json-schema")) {
          //   return tsObj.visitEachChild(node, visitor, this.context);
          // }
          const typeArgument = node.typeArguments[0];

          const type = typeChecker.getTypeFromTypeNode(typeArgument);
          const symbol = type.aliasSymbol || type.symbol;

          const argNode = node.arguments[0];
          const options = argNode
            ? getOptions(argNode)
            : {
                ignoreErrors: true,
              };

          if (typeof symbol === "undefined" || symbol === null) {
            throw new Error(`Could not find symbol for passed type`);
          }

          debugger;
          (globalThis as any).process.cwd = () => "";
          const sg = new tgen.SchemaGenerator(
            program as any,
            tgen.createParser(program as any, {}),
            tgen.createFormatter({}),
            {}
          );

          const schema = sg.createSchema(symbol.name);
          // const schema = tjs.generateSchema(
          //   program as unknown as tjs.Program,
          //   symbol.name,
          //   options as tjs.PartialArgs
          // );
          return toLiteral(schema);
        }
      }

      if (tsObj.isImportDeclaration(node)) {
        const rawSpec = node.moduleSpecifier.getText();
        const spec = rawSpec.substring(1, rawSpec.length - 1);

        if (spec === "ts-transform-json-schema") {
          return undefined;
        }
      }
      console.log("visitEachChild");
      return tsObj.visitEachChild(node, visitor, this.context);
    };

    return visitor;
  }

  private visitNodeAndChildren(
    node: ts.SourceFile,
    program: ts.Program
  ): ts.SourceFile;
  private visitNodeAndChildren(
    node: ts.Node,
    program: ts.Program
  ): ts.Node | undefined {
    const visitor = this.getVisitor(program);
    return tsObj.visitNode(node, visitor);
  }
}

export default function testTransformer(
  program: ts.Program,
  config?: Partial<Options>
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const transformer = new Transformer(context, config);
    return (file: ts.SourceFile) => {
      return transformer.visitSourceFile(file, program);
    };
  };
}

// TODO: Factor out, test
function toLiteral(input: unknown): ts.PrimaryExpression {
  if (typeof input === "string") {
    return tsObj.factory.createStringLiteral(input);
  }

  if (typeof input === "number") {
    return tsObj.factory.createNumericLiteral(input);
  }

  if (typeof input === "boolean") {
    return input ? tsObj.factory.createTrue() : tsObj.factory.createFalse();
  }

  if (typeof input === "object" && Array.isArray(input)) {
    return tsObj.factory.createArrayLiteralExpression(input.map(toLiteral));
  }

  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    const ob = input as any;
    return tsObj.factory.createObjectLiteralExpression(
      Object.keys(ob).map((key) =>
        tsObj.factory.createPropertyAssignment(
          tsObj.factory.createStringLiteral(key),
          toLiteral(ob[key])
        )
      )
    );
  }

  return tsObj.factory.createNull();
}

function getOptions(node: ts.Node): unknown {
  try {
    return JSON5.parse(node.getText());
  } catch (err) {
    return;
  }
}
