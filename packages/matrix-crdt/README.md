# Matrix-CRDT

Matrix-CRDT enables you to use [Matrix](https://matrix.org/) as a backend for distributed, real-time collaborative web applications that sync automatically.

< TODO >

## Usage with Yjs

To setup Matrix-CRDT, 3 steps are needed:

- Create a [Yjs](https://github.com/yjs/yjs) `Y.Doc`
- Create and authenticate a client from [matrix-js-sdk](https://matrix.org/docs/guides/usage-of-the-matrix-js-sdk)
- Create and initialize your Matrix-CRDT `MatrixProvider`

```typescript
import { MatrixProvider } from "matrix-crdt";
import * as Y from "yjs";
import sdk from "matrix-js-sdk";

// See https://matrix.org/docs/guides/usage-of-the-matrix-js-sdk
// for login methods
const matrixClient = sdk.createClient({
  baseUrl: "https://matrix.org",
  accessToken: "....MDAxM2lkZW50aWZpZXIga2V5CjAwMTBjaWQgZ2Vu....",
  userId: "@USERID:matrix.org",
});

// Create a new Y.Doc and connect the MatrixProvider
const ydoc = new Y.Doc();
const provider = new MatrixProvider(ydoc, matrixClient, {
  type: "alias",
  alias: "matrix-room-alias",
});
provider.initialize();

// array of numbers which produce a sum
const yarray = ydoc.getArray("count");

// observe changes of the sum
yarray.observe((event) => {
  // print updates when the data changes
  console.log("new sum: " + yarray.toArray().reduce((a, b) => a + b));
});

// add 1 to the sum
yarray.push([1]); // => "new sum: 1"
```

## SyncedStore

You can also use [SyncedStore](https://syncedstore.org/docs/) and use Matrix-CRDT as SyncProvider.
