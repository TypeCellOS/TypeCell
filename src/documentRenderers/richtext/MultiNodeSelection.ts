import { NodeSelection, Selection } from "prosemirror-state";
import { Node, NodeRange } from "prosemirror-model";

class MultiNodeSelection extends Selection {
  selection: Selection;
  nodes: Array<Node>;
  nodeSelections: Array<NodeSelection>;

  constructor(selection: Selection) {
    const doc = selection.$anchor.doc;

    // We can't use only nodeRange since it represents nodes at the same depth, i.e. groups nested nodes into one.
    // We only use it to get the first position in the first node and the last position in the last node.
    let nodeRange = new NodeRange(selection.$from, selection.$to, 0);
    console.log(nodeRange);
    let pos = nodeRange.start;
    let end = nodeRange.end;

    super(doc.resolve(pos), doc.resolve(end));

    this.selection = selection;
    this.nodes = [];
    this.nodeSelections = [];

    while (pos < end) {
      let node = doc.resolve(pos).parent;

      // For nested blocks
      while (!node.isTextblock) {
        pos++;
        node = doc.resolve(pos).parent;
      }
      this.nodes.push(node);
      this.nodeSelections.push(new NodeSelection<any>(doc.resolve(pos)));
      pos = pos + node.nodeSize;
    }
  }

  eq(p: Selection<any>): boolean {
    if (p instanceof MultiNodeSelection) {
      return p.nodes.length == this.nodes.length;
    }
    return false;
  }
}

export default MultiNodeSelection;
