/**
 * @vitest-environment jsdom
 */

// http:localhost/_docs:/http:localhost/_docs/README.md
// http:localhost/_docs:/README.md

import { describe, expect, it } from "vitest";
import {
  identifiersToPath,
  pathToIdentifier,
  pathToIdentifiers,
} from "./identifierPathHelpers";

// fs:localhost:/fs:localhost/README.md
// fs:localhost:/README.md

// typecell:localhost/@yousef:/typecell:localhost/@yousef/id123

describe("Identifier", () => {
  it("parses basic identifier", () => {
    const identifier = pathToIdentifier("http:localhost/_docs/README.md");
    expect(identifier.uri.scheme).toBe("http");
    expect(identifier.uri.authority).toBe("localhost");
    expect(identifier.uri.path).toBe("/_docs/README.md");
  });

  it("parses basic path", () => {
    const identifiers = pathToIdentifiers("http:localhost/_docs/README.md");
    expect(identifiers.length).toBe(1);

    const identifier = identifiers[0];
    expect(identifier.uri.scheme).toBe("http");
    expect(identifier.uri.authority).toBe("localhost");
    expect(identifier.uri.path).toBe("/_docs/README.md");
  });

  it("parses nested identifier with full paths", () => {
    const identifiers = pathToIdentifiers(
      "http:localhost/_docs:/http:localhost/_docs/README.md"
    );

    expect(identifiers.length).toBe(2);

    expect(identifiers[0].uri.scheme).toBe("http");
    expect(identifiers[0].uri.authority).toBe("localhost");
    expect(identifiers[0].uri.path).toBe("/_docs");

    expect(identifiers[1].uri.scheme).toBe("http");
    expect(identifiers[1].uri.authority).toBe("localhost");
    expect(identifiers[1].uri.path).toBe("/_docs/README.md");
  });

  it("parses nested identifier with simplified", () => {
    const identifiers = pathToIdentifiers("http:localhost/_docs:/README.md");

    expect(identifiers.length).toBe(2);

    expect(identifiers[0].uri.scheme).toBe("http");
    expect(identifiers[0].uri.authority).toBe("localhost");
    expect(identifiers[0].uri.path).toBe("/_docs");

    expect(identifiers[1].uri.scheme).toBe("http");
    expect(identifiers[1].uri.authority).toBe("localhost");
    expect(identifiers[1].uri.path).toBe("/_docs/README.md");
  });

  it("parses 3 nested identifiers with simplified", () => {
    const identifiers = pathToIdentifiers(
      "http:localhost/_docs:/README.md:/test.md"
    );

    expect(identifiers.length).toBe(3);

    expect(identifiers[0].uri.scheme).toBe("http");
    expect(identifiers[0].uri.authority).toBe("localhost");
    expect(identifiers[0].uri.path).toBe("/_docs");

    expect(identifiers[1].uri.scheme).toBe("http");
    expect(identifiers[1].uri.authority).toBe("localhost");
    expect(identifiers[1].uri.path).toBe("/_docs/README.md");

    expect(identifiers[2].uri.scheme).toBe("http");
    expect(identifiers[2].uri.authority).toBe("localhost");
    expect(identifiers[2].uri.path).toBe("/_docs/README.md/test.md");
  });
});

describe("Path handling", () => {
  it("simplifies paths", () => {
    const identifiers = pathToIdentifiers(
      "http:localhost/hello/:/http:localhost/hello/README.md"
    );
    const path = identifiersToPath(identifiers);
    expect(path).toBe("http:localhost/hello/:/README.md");
  });

  it("simplifies paths of tc identifiers", () => {
    const identifiers = pathToIdentifiers(
      "typecell:typecell.org/test~dsdf34f:/typecell:typecell.org/sub~dsdf34adff"
    );
    const path = identifiersToPath(identifiers);
    expect(path).toBe("http:localhost/hello/:/README.md");
  });

  it("handles shorthands", () => {
    const identifiers = pathToIdentifiers(
      "http:localhost/_docs/:/http:localhost/_docs/README.md"
    );
    const path = identifiersToPath(identifiers);
    expect(path).toBe("docs/README.md");
  });

  it("handles default base", () => {
    const identifiers = pathToIdentifiers("@user/doc");

    expect(identifiers.length).toBe(1);

    expect(identifiers[0].uri.scheme).toBe("mx");
    expect(identifiers[0].uri.authority).toBe("mx.typecell.org");
    expect(identifiers[0].uri.path).toBe("/@user/doc");

    const path = identifiersToPath(identifiers);
    expect(path).toBe("@user/doc");
  });
});

// TODO: add tests for mixed paths (projects with mixed identifiers)
