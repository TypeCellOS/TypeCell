import {
  onAuthenticatePayload,
  onChangePayload,
  Server,
} from "@hocuspocus/server";

async function onAuthenticate(data: onAuthenticatePayload) {
  const { token } = data;

  // Example test if a user is authenticated using a
  // request parameter
  if (token !== "super-secret-token") {
    throw new Error("Not authorized!");
  }

  // Example to set a document to read only for the current user
  // thus changes will not be accepted and synced to other clients
  // if (someCondition === true) {
  //   data.connection.readOnly = true;
  // }

  // You can set contextual data to use it in other hooks
  return {
    user: {
      id: 1234,
      name: "John",
    },
  };
}

async function onChange(data: onChangePayload) {
  /*const save = () => {
    // Convert the y-doc to something you can actually use in your views.
    // In this example we use the TiptapTransformer to get JSON from the given
    // ydoc.
    const prosemirrorJSON = TiptapTransformer.fromYdoc(data.document);

    // Save your document. In a real-world app this could be a database query
    // a webhook or something else
    writeFile(
      `/path/to/your/documents/${data.documentName}.json`,
      prosemirrorJSON
    );

    // Maybe you want to store the user who changed the document?
    // Guess what, you have access to your custom context from the
    // onAuthenticate hook here. See authorization & authentication for more
    // details
    console.log(
      `Document ${data.documentName} changed by ${data.context.user.name}`
    );
  };

  debounced?.clear();
  debounced = debounce(() => save, 4000);
  debounced();*/
}

const server = Server.configure({
  onAuthenticate,
});

server.listen();
