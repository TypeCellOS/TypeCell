function hash(str: string) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// backrefs: [
//     {namespace: "@workspace", owner: "project", type: "child", doc: "root"}
//   ]

// type Ref = {
//   namespace: string // @yousefed/renderer
//   type: string; //

// };

export class Ref {
  public constructor(
    public readonly namespace: string,
    public readonly type: string,
    public readonly target: string,
    private oneToMany: boolean,
    private reverseInfo: {
      oneToMany: boolean;
      type: string;
    }
  ) {
    if (!namespace || !type || !target || !reverseInfo) {
      throw new Error("invalid arguments for ref");
    }
  }

  public uniqueHash(): number {
    let hashcode = hash(this.namespace) ^ hash(this.type);

    if (this.oneToMany) {
      hashcode = hashcode ^ hash(this.target);
    }
    return hashcode;
  }

  public reverse(source: string): Ref {
    return new Ref(
      this.namespace,
      this.reverseInfo.type,
      source,
      this.reverseInfo.oneToMany,
      {
        oneToMany: this.oneToMany,
        type: this.type,
      }
    );
  }

  public toJS() {
    return {
      namespace: this.namespace,
      type: this.type,
      target: this.target,
    };
  }
}
