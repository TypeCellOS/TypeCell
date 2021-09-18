import { hash } from "../util/hash";

export function createRef(
  definition: ReferenceDefinition,
  targetId: string,
  sortKey?: string
): Ref {
  if (
    definition.relationship.type === "many" &&
    definition.relationship.sorted &&
    !sortKey
  ) {
    throw new Error("expected sortKey");
  }
  return {
    namespace: definition.namespace,
    type: definition.type,
    target: targetId,
    sortKey,
  };
}

export type Ref = {
  namespace: string;
  type: string;
  target: string;
  sortKey?: string;
};

export function validateRef(
  obj: any,
  referenceDefinition?: ReferenceDefinition
): obj is Ref {
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
      referenceDefinition.relationship.type === "many" &&
      referenceDefinition.relationship.sorted
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

export function getSortedRef(obj: {
  namespace: string;
  type: string;
  target: string;
  sortKey: string;
}) {
  if (!obj.namespace || !obj.target || !obj.type || !obj.sortKey) {
    throw new Error("invalid ref");
  }
  return obj;
}

export type ReferenceDefinition = {
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

  /**
   * e.g.:
   * - "parent" is unique, a document can only have 1 parent
   * - "child" is not unique, a document can have multiple parents
   */
  relationship: { type: "unique" } | { type: "many"; sorted: boolean };

  /**
   * Information needed to get the Reference stored in the "other" document
   * (e.g., map from "child" to "parent" and vice versa)
   */
  reverseInfo: {
    relationship: { type: "unique" } | { type: "many"; sorted: boolean };
    type: string;
  };
};

export function getHashForReference(
  definition: ReferenceDefinition,
  targetId: string
): string {
  // uniqueness by namespace + type
  let hashcode = hash(definition.namespace) ^ hash(definition.type);

  if (definition.relationship.type === "many") {
    // If many of the namspace/type relations can exists
    // add uniqueness by targetId
    hashcode = hashcode ^ hash(targetId);
  }
  return hashcode + "";
}

export function reverseReferenceDefinition(
  definition: ReferenceDefinition
): ReferenceDefinition {
  return {
    ...definition,
    ...definition.reverseInfo,
    reverseInfo: {
      type: definition.type,
      relationship: definition.relationship,
    },
  };
}

export function createOneToManyReferenceDefinition(
  namespace: string,
  type: string,
  reverseType: string,
  sorted: boolean
): ReferenceDefinition {
  return {
    namespace,
    type,
    relationship: { type: "many", sorted },
    reverseInfo: {
      type: reverseType,
      relationship: { type: "unique" },
    },
  };
}
