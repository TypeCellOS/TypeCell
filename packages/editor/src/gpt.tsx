import { fetchEventSource } from "@microsoft/fetch-event-source";
import { uuid } from "vscode-lib";

class RetriableError extends Error {}
class FatalError extends Error {}

type MessageData = {
  message: {
    id: string;
    role: "assistant";
    user: null;
    create_time: null;
    update_time: null;
    content: {
      content_type: "text";
      parts: string[];
    };
    end_turn: null;
    weight: 1.0;
    metadata: {};
    recipient: "all";
  };
  conversation_id: string;
  error: null;
};

type SimpleResponseMessage = {
  content: string;
  conversation_id: string;
  id: string;
};

const auth = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL2F1dGgiOnsidXNlcl9pZCI6InVzZXItRllqNmdTNFNaVlZ0c05hM1RNUzd6dmNzIn0sImlzcyI6Imh0dHBzOi8vYXV0aDAub3BlbmFpLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNzA1Njk0MzgwMzE0NTE0MzI1NSIsImF1ZCI6WyJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxIiwiaHR0cHM6Ly9vcGVuYWkuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY3MDE3NzE4MywiZXhwIjoxNjcwMTg0MzgzLCJhenAiOiJUZEpJY2JlMTZXb1RIdE45NW55eXdoNUU0eU9vNkl0RyIsInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUgbW9kZWwucmVhZCBtb2RlbC5yZXF1ZXN0IG9yZ2FuaXphdGlvbi5yZWFkIG9mZmxpbmVfYWNjZXNzIn0.QDAoZUzQJcCZ5eBA-CuZTQ_YaHnxZVnGUXM-KnDoueI2XHeEijlmv4x4UzX85a6LVaZeIyPqfSTquxGO7gWY81srJzz9koyPf_iwbyGBKhjITdO6zKzgI_vSS0jM-rnk1k0RqfZyd4Z9WNvycV0-yW1wMXFvgBRW3vpuewk-qVwT3QrQj9Fdsq5NuHVqEodBoA8CIqYKtMstZUEA59ADmk-rPEQs444mpqZfHMSgBPS5JJ6gSDyxM81pab7TdrfYraVVZmDt0Csc48kfK734hKlnK-mtix_2DMTHaYUiQXLzZhQTosL6FltPb2fa9TnozwTCDHzEniAUTm6lj1U89w`;
export function fetchGPT(data: {
  message_id: string;
  message: string;
  parent_message_id: string;
  conversation_id: string | undefined;
}) {
  const messageHistory: MessageData[] = [];
  let done = false;
  return new Promise<SimpleResponseMessage>((resolve, reject) => {
    fetchEventSource("https://chat.openai.com/backend-api/conversation", {
      method: "POST",

      headers: {
        authorization: auth,
        "Content-Type": "application/json",
        cookie: `__Host-next-auth.csrf-token=1a2a1d23557a8f85c0043d8fd4b465cebe9ccf976b32d38baf0ee39dcfc540bc|883dc3ccdd9cca037fd1e6a2c388912e10fa92f703287c6c71c42c216421c5b6; __Secure-next-auth.callback-url=https://chat.openai.com/; intercom-device-id-dgkjq2bp=dbbdb009-4457-47d5-94c5-ffa707a66b56; intercom-session-dgkjq2bp=eXl2bnpNdnJ0OFErTXFGTVVkVkg3aG1WUldXY29GT2owT0NtZjJMVmpwMnJmK3d4MkUzYlgvOTZVK0Vtek1jei0tNktDbTNuWldnZTdsZ0VlZlJNNlplQT09--78deade3f30d5d88415a213dbdd12bb97c052b7f; mp_d7d7628de9d5e6160010b84db960a7ee_mixpanel={"distinct_id": "user-FYj6gS4SZVVtsNa3TMS7zvcs","$device_id": "184cd27f612e3e-00e294dcc37db-18525635-201b88-184cd27f613b46","$search_engine": "google","$initial_referrer": "https://accounts.google.com/","$initial_referring_domain": "accounts.google.com","$user_id": "user-FYj6gS4SZVVtsNa3TMS7zvcs"}; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..RV3XSG9h-6csoPZ_.BhmCRcqs-9RiNBO6t5Jff5WClJSpUWfpRWTZJpwZXIfuzHmJCm6UDI8L5tr24MrF1acu62FPNsEg82yicQNg-9shrKb4mobw9jqSI3b0B1KsV0k-rcCp--KONJp6wTmY522P00Wt0_-DjI78fumbn7NHH_0AoGNgJ5EcjgM8VqUW4amR0h9dlvPoo9svQPSO1h2Cjeyvs9AykCI-H4xAfTE50fFonIdKwENgUGgfQWVlZw1yaO3MorV1_X7qK_8LVU5KHyIOaO2Vobo9bJetf0pM9tIflWVP3I0CLfaIZWn6yYVgIYZQtn0hnkWjtN_SxP1DjhTFdrzoAqEPrHjT_FFRBa6ubM-EkaqRIhYBFQnNCgjHK_2hKc-rclMK22xn14LF0Gv8Bv0hB_45PICWGh4VG9mzTHzQcrADDairQNnpVMVIKyew5P1DufAvWfqKltPBOp0Vue3YHIoaT_ivaRgwGvRwCpMULDwc9yx8wwDtAF1goRGPfKpSFps1_6My2BHzKj231ozp6oTNUd2veodY5JFwb-26FNcfCiGPBtOAS6sIW5Le8b-vbwUCkq_1X-n1naFWU2H9vv4nBg1s6u5y7sbffv_5ZGpoylOh1hSvNhmBrSXtwmk90DdUULg-af6vgWThnHf6twNxb88SpiWwCnofxxMC94BE-hTFNqlG1x90m_5an0fZYZNpsssc8et7v-pY7HMR7dgQ2zoaAMzBvkp5HQzammFaIn89RuVHGBRCaUKinh5-am9bbHTaE4Pj9Bv3jJGxykiZASgrasFZirV5vVWswplJnXgiGpROz4yAOv-wOJjFx3It0tMVJYkhJw4lh67XvMK5I-tgtr0JYixKMgvET22N29fy5WJV1HqlipEjaP3FSxlupX_upAslu5dWKgkI767k5XNZaeEoIiFy3K0-H63jnkZ2J_Zeycl1qX-9NdlwPbd4Z38Ag-x0zAKKUpg07NbAopLXNrLF0zavvCCRErj8QgixcdEJZiQEZNxbUHj6OJCP6m3UmIY52WaQZnhFlZ0YFcr4yEEPE48fukZ-2WQczwEhyDFrrhuqbxPJ2U8WXBXitpZkdbYGs_g9OvzdnZMWtQ784knptXLhyIHEYYGIan062fGei5Ot5feyIdZe0dkjJyNLFlLW-8XfpLsHaVwIPm6wcfbJCW1jHncvLgBcz2-65XkmnYXMZxPqvCvWihR-2CzGbOUIbwWfoDQkhDJR24JNnC7f4gw7iAi-nTTLAmLx3V73TRFFFL2s6SRo3IgmqM3ZDz4yaEl0-_Ll6ngUTIArQI1G42oOk9xFNolsgTrlSixHqSuLYgBMZbhtcHVeNzmS1LduSfvbKxgUsdaWf-t7EztWPntpzSPd6ghCIEAcD-FDqBvgx7ggU-kxtXuNBBzxNlbIOP5RgFXmt5L1k5-8mgPkZu2JjiLZyP3hVsMR68BqZZ4tBm7-QEkLM2rb0KojO0Bnjw0Vt4qEZV9QLPlN2fSjjKniq5xaWtSe8fqnbVTxQfePDapL7ftuQnEvNBXifGKzUJdILwar6p8VJqrS6Fzu0BhfWvhDN5aMVqTW4J7265UE0Jtl00bc0rKWn9Gc77gbtbLbT9pSjNzx-ijkdBmaSttJEOX_aLNyi7PJmKahos7_Iz6_Ex7uFC-VeS48DDWYZjfthc26hmp8eVxbEXZ3IAEeST2fUfUBpYOoEvqgmpaQwVs6gczRqGGb6A0d1grhDdOxea8vGyW01aNg8KHYF0VyWCTnZ8-JhxlDaJ3Z3FXhg1uVc5hWze_35KTUWOwFjOFo20SY-gP6gxqGwqRhy_nB_kWrngfzr5s2ru8jS6jfd7fA7eBsZU8HUhEdC0tXiUDxY9TPiUKBNvVcoGgPnY5qQJVVJQc-YKMR2l_YfPW6Ys2J9W_liV2tjlWEg34-5JDJaphPscMiBfR1qmAWwtoptTjNTy5vtY2Y-itk0hVaZyxjEv5AmH58I00Wv4A9dMpI0TzDNik8bz8OhK3Cs3TLF0HafpaY1oAP29WbIvwfToXj1mckb2Az9VGl9AI2YMuEo-XBrLBfEQbcL_iqcT-vGHRtdctykTIp0CXUouONXMIAVEW6VqUEVEG4UDXPPjeKNmPPKVDgbpkqikn3omOZMR3ywQSYZsIrQLbqwzw9JVL-gS9-J2oUP1iMLMg696XfGV44PWdhmOfZ0jD6-9MvYTNSPy4.PnHN539uNyjSG_wHYxHquw`,
      },
      body: JSON.stringify({
        action: "next",
        messages: [
          {
            id: data.message_id,
            role: "user",
            content: {
              content_type: "text",
              parts: [data.message],
            },
          },
        ],
        conversation_id: data.conversation_id,
        parent_message_id: data.parent_message_id,
        model: "text-davinci-002-render",
      }),
      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type") ===
            "text/event-stream; charset=utf-8"
        ) {
          // const text = await response.text();
          // console.log("text", text);
          return; // everything's good
        } else if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          // client-side errors are usually non-retriable:
          throw new FatalError();
        } else {
          throw new RetriableError();
        }
      },
      onmessage(msg) {
        // if the server emits an error message, throw an exception
        // so it gets handled by the onerror callback below:
        if (msg.event === "FatalError") {
          throw new FatalError(msg.data);
        }
        console.log(msg);

        const data = msg.data;
        if (data === "[DONE]") {
          done = true;
          const lastMsg = messageHistory[messageHistory.length - 1];
          resolve({
            id: lastMsg.message.id,
            content: lastMsg.message.content.parts[0],
            conversation_id: lastMsg.conversation_id,
          });
        } else {
          messageHistory.push(JSON.parse(data));
        }
      },
      onclose() {
        // if the server closes the connection unexpectedly, retry:
        if (!done) {
          throw new RetriableError();
        }
      },
      onerror(err) {
        console.error(err);
        reject(err);
        throw err;
        //   if (err instanceof FatalError) {
        //     throw err; // rethrow to stop the operation
        //   } else {
        //     throw err;
        //     // do nothing to automatically retry. You can also
        //     // return a specific retry interval here.
        //   }
      },
    });
  });
}

export async function testGPT(data: {
  message_id: string;
  message: string;
  parent_message_id: string;
  conversation_id: string | undefined;
}) {
  const parent_message_id = uuid.generateUuid();
  //   debugger;
  let response = await fetchGPT({
    message_id: uuid.generateUuid(),
    conversation_id: undefined,
    message: "Hello, my name is Cat",
    parent_message_id,
  });
  console.log("RESPONSE", response);

  response = await fetchGPT({
    message_id: uuid.generateUuid(),
    conversation_id: response.conversation_id,
    message: "What is my name?",
    parent_message_id: response.id,
  });
  console.log("RESPONSE", response);
}

const initialMessage = `
I'm creating a live programming environment for Typescript called TypeCell. TypeCell works as follows:

- Programs consists of a list of cells. Cells execute live, as-you type.
- Cells can export variables using the javascript / typescript \`export\` syntax. These variables are shown as the output of the cell.
- The exported variables by a cell are available in other cells, under the \`$\` variable. e.g.: \`$.exportedVariableFromOtherCell\`
- When the exports of one cell change, other cells that depend on those exports, update live, automatically.
- React / JSX components will be displayed automatically. E.g.: \`export let component = <div>hello world</div>\` will display a div with hello world.

Example usage:

Cell 1:

\`\`\`
// This displays both \`myname\` and the length of myname as the output of cell 1:

export let myname = "James";
export let length = myname.length;
\`\`\`

Cell 2:

\`\`\`
// This uses the exported \`myname\` from cell 1, using the TypeCell \`$.myname\` syntax, and shows the capitalized name using React

export let capitalized = <div>{$.myname.toUpperCase()}</div>
\`\`\`

TypeCell also supports a helper method \`typecell.Input\` with which you can render an input element so that the user can input a value. 
The selected value is then available on the $ context as well. To render the input element, it needs to be the only export of the cell (otherwise an object inspector is shown to inspect all exports)

Example:

\`\`\`
// render a range-input and make the value available under $.range
export let range = typecell.Input<number>(
  <input type="range" min="20" max="100" />
);
\`\`\`

Or:

\`\`\`
// render a text input and make the value available under $.text1. The default value is "default text"
export let text1 = typecell.Input(<input type="text" />, "default text");
\`\`\`

I want you to output answers to my questions in the following format:

CELL <cell number>:
<cell code>

For example, when asking to create two cells, output

CELL 1:
// code of cell one

CELL 2:
// code of cell one

When I then ask you to change the code of CELL 2, you can answer with only CELL 2, i.e.:

CELL 2:
// changed code of cell one

For this initial instruction, just answer "ok"
`;

export class GPTSession {
  private parent_message_id = uuid.generateUuid();
  private conversation_id: string | undefined;
  constructor() {}

  public get Initialized() {
    return this.conversation_id !== undefined;
  }
  public async initialize() {
    if (this.conversation_id) {
      throw new Error("already initialized");
    }

    const parent_message_id = uuid.generateUuid();
    //   debugger;
    console.log("REQUESTING GPT (initial");
    let response = await fetchGPT({
      message_id: uuid.generateUuid(),
      conversation_id: undefined,
      message: initialMessage,
      parent_message_id,
    });
    this.parent_message_id = response.id;
    this.conversation_id = response.conversation_id;
    console.log("RESPONSE", response);
  }

  public async request(data: { message: string }) {
    if (!this.conversation_id) {
      throw new Error("not yet initialized");
    }

    const response = await fetchGPT({
      message_id: uuid.generateUuid(),
      conversation_id: this.conversation_id,
      message: data.message,
      parent_message_id: this.parent_message_id,
    });
    this.parent_message_id = response.id;
    console.log("RESPONSE", response);

    return response;
  }
}
/*





create two cells, one that exports a list of numbers, and one that displays those numbers using react

*/
