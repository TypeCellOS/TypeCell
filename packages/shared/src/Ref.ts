import { uniqueId } from "@typecell-org/util";

import { hash } from "vscode-lib";

export function createRef<T extends ReferenceDefinition>(
  definition: T,
  targetId: string,
  sortKey?: string
): Ref<T> {
  if (definition.relationship === "many" && definition.sorted && !sortKey) {
    throw new Error("expected sortKey");
  }
  if (definition.relationship === "unique" || !definition.sorted) {
    if (sortKey) {
      throw new Error("unexpected sortKey");
    }
    const ref: Ref<T> = {
      id: uniqueId.generateId("reference"),
      namespace: definition.namespace,
      type: definition.type,
      target: targetId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any; // TODO: fix type
    return ref;
  } else {
    if (!sortKey) {
      throw new Error("expected sortKey");
    }
    const ref: Ref<T> = {
      id: uniqueId.generateId("reference"),
      namespace: definition.namespace,
      type: definition.type,
      target: targetId,
      sortKey,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any; // TODO: fix type
    return ref;
  }
}

export type Ref<T extends ReferenceDefinition> = {
  id: string;
  namespace: T["namespace"];
  type: T["type"];
  target: string;
  sortKey: T extends ManyReferenceDefinition
    ? T["sorted"] extends true
      ? string
      : never
    : never;
};

export function validateRef<T extends ReferenceDefinition>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  referenceDefinition?: T
): obj is Ref<T> {
  if (!obj.namespace || !obj.target || !obj.type) {
    throw new Error("invalid ref");
  }
  if (referenceDefinition) {
    if (
      obj.namespace !== referenceDefinition.namespace ||
      obj.type !== referenceDefinition.type
    ) {
      throw new Error("reference not matching definition");
    }
    if (
      referenceDefinition.relationship === "many" &&
      referenceDefinition.sorted
    ) {
      if (!obj.sortKey) {
        throw new Error("no sortkey found");
      }
    } else {
      if (obj.sortKey) {
        throw new Error("found sort key, but not expected");
      }
    }
  }
  return true;
}

export type UniqueReferenceDefinition = {
  /**
   * Owner of the schema
   * e.g.: "@yousefed/document"
   */
  namespace: string;
  /**
   * Type of the relation
   * e.g.: "child", "parent", "mention"
   */
  type: string;

  /*
   * a document can have only have a reference of this type to a single document
   */
  relationship: "unique";
};

export type ManyReferenceDefinition = {
  /**
   * Owner of the schema
   * e.g.: "@yousefed/document"
   */
  namespace: string;
  /**
   * Type of the relation
   * e.g.: "child", "parent", "mention"
   */
  type: string;

  /*
   * a document can have multiple references of this type to different documents
   */
  relationship: "many";

  /*
   * if true, the references are sorted by a sortKey fractional index
   */
  sorted: boolean;
};

export type ReferenceDefinition =
  | UniqueReferenceDefinition
  | ManyReferenceDefinition;

export function getHashForReference(
  definition: ReferenceDefinition,
  targetId: string
): string {
  // uniqueness by namespace + type
  let hashcode =
    hash.stringHash(definition.namespace, 0) ^
    hash.stringHash(definition.type, 0);

  if (definition.relationship === "many") {
    // If many of the namspace/type relations can exists
    // add uniqueness by targetId
    hashcode = hashcode ^ hash.stringHash(targetId, 0);
  }
  return hashcode + "";
}

// export function reverseReferenceDefinition(
//   definition: ReferenceDefinition
// ): ReferenceDefinition {
//   return {
//     ...definition,
//     ...definition.reverseInfo,
//     reverseInfo: {
//       type: definition.type,
//       relationship: definition.relationship,

//     },
//   };
// }

export function createManyToOneReferenceDefinition(
  namespace: string,
  type: string
): ReferenceDefinition {
  return {
    namespace,
    type,
    relationship: "unique",
  };
}

export function createManyToManyReferenceDefinition(
  namespace: string,
  type: string,
  // reverseType: string,
  sorted: boolean
): ReferenceDefinition {
  return {
    namespace,
    type,
    relationship: "many",
    sorted,
    // reverseInfo: {
    //   type: reverseType,
    //   relationship: { type: "many" },
    // },
  };
}
