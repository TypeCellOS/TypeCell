Primary goals of integrating Matrix and TypeCell:

- Central storage of documents when there are no Peers online
- (Future) support for end-to-end encryption (e2ee)
- Support for permissions / groups / organizations via Matrix Rooms and Spaces
- Find users / documents clients are not aware of yet

Secondary goals:

- good for enterprises? (can host on premises, SSO support)
- federation (decentralized web)

NOT a goal: centralized source-of-truth of Yjs documents. We want to stick with the offline-first / distributed model as long as possible. This means all document-based operations (create / edit / delete? docs) should be possible when the user or server is offline.

# Use cases (public documents)

## creating a document

1. Create document on server

   a. if fail because Offline. Proceed to 2

   b. if fail for other reason, fail (and show to user)

   c. If success, proceed to 3

2. Offline:

   a. Create document using y-indexeddb

   b. Save document to `PendingMatrixCreate`

3. Load document with y-indexeddb

## viewing a document

We don't need to join a room to view public documents. Instead, we can use PeekRoom to retrieve updates and stay updated. Additionally, we can use a public WebRTC signalling server to connect to peers and retrieve updates in real-time.

1. Get document from server (by alias)

2. Verify Alias owner

## editing a document

For public documents, we can send updates over both WebRTC connection and MatrixProvider connection (on a slower rate). TODO: figure out if we need to join the room first.

if offline?

## deleting a document

1. Delete document on server

   a. if fail because Offline. Proceed to 2

   b. if fail for other reason, fail (and show to user)

   c. if success, proceed to 3

2. Offline:

   a. Delete document using y-indexeddb

   b. Save document to `PendingMatrixDelete`

3. Delete document from y-indexeddb

_PendingMatrixCreate_

1. On startup, create rooms for `PendingMatrixCreate` queue:

   a. if failing because offline: keep in queue

   b. if fail for other reasons then offline (no access, duplicate): delete y-indexeddb document (perhaps make a copy "tombstone")

   c. if success: establish a connection with the room and sync y-indexeddb document to it

_PendingMatrixDelete_

_logout_

_login_

# Documents, URIs and Spaces

- Documents are identified by a URI of `<owner>/<documentId>`.
- The Matrix equivalent of a document is a Room.
- <s>A user has the id to his _root space_ in his userProfile under the key `typecell_space`
- Only the owner of this _root space_ can add / remove documents from it</s>
- Rooms are aliased with TypeCell URIs `<owner>/<documentId>`.
- When resolving a TypeCell URI to a room, we MUST verify that it was created by `<owner>`. Because at this moment we don't reserve the alias `<owner>/<documentId>` on the server, so in theory it could be created by someone else. (Later, we can prevent this using a Matrix Application Server).

TODO:

documents by default read-public, write-private?

Proof of write-access by posting public-key in channel periodically
