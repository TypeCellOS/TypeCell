# Matrix-CRDT

Matrix-CRDT is a yjs

We believe next generation internet applications should be built local-first (https://www.inkandswitch.com/local-first.html), which has substantial benefits in terms of privacy, security, performance and societal benefits like decreasing dependence on central cloud actors. The entire system is built on top of Conflict-free Replicated Data Types (CRDTs) to achieve this.

Matrix-CRDT will be a library to use Matrix.org nodes as central storage and communication layer for secure, decentralised and real-time sharing of CRDT updates. Currently, Matrix is primarily used for chat systems, but early research has shown it can be reused as a backend for CRDT-based applications, as document updates are well-suited to be shared over the Matrix protocol.

With Matrix-CRDT, we want to build a developer-friendly library to create CRDT-based applications with built-in support for identity, authentication, self-hosting, federation, and end-to-end encryption powered by Matrix.

That being said, we believe syncing Yjs documents over Matrix has several benefits:
Yjs updates are very similar to (chat) Messages, that Matrix has been optimized for. The core model of Messages in a Room forming a Conversation is similar to Yjs Updates in a Room forming a Document. Because Yjs is update-based (similar to a conversation protocol), this makes it a better fit than storage backends that are based on large “files” instead of a stream of many small updates.
Matrix server implementations cover many layers needed to build a complete application, that would be time-consuming to implement ourselves (even when combining multiple different open source projects):
Storage and real-time syncing of updates
Authentication (including support for SSO and 3rd party providers)
Access control via Rooms and Spaces
E2EE
Federation
I think a bridge between Matrix and Yjs would be highly beneficial to the Yjs community. I’ve been participating actively in the Yjs community and have noticed that although users are very excited to be able to quickly add real-time collaboration features using y-webrtc, it isn’t long until more advanced questions come up: How do I add authentication? Encryption? How do I store documents in my database? How do I initialize a document? I believe matrix-crdt could be a great out-of-the-box solution to create easy-to-deploy collaborative applications that fills a gap here.
Although Matrix is still in its early days in terms of adoption-cycle, it’s backed by organizations committed to building a more open and decentralized web (hopefully they’ll also be able to use the recent 30M funding to accelerate their vision). Note that we're also not bound to the number of Matrix users (which exceed millions) or servers, as we'll make it easy to sign up from TypeCell itself and will host a default server.
