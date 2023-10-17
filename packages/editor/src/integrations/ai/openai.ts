import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAI } from "openai";

export async function queryOpenAI(parameters: {
  messages: OpenAI.Chat.ChatCompletionCreateParams["messages"];
  functions?: OpenAI.Chat.ChatCompletionCreateParams["functions"];
  function_call?: OpenAI.Chat.ChatCompletionCreateParams["function_call"];
}) {
  // get key from localstorage
  let key = localStorage.getItem("oai-key");
  if (!key) {
    key = prompt(
      "Please enter your OpenAI key (not shared with TypeCell, stored in your browser):",
    );
    if (!key) {
      return {
        status: "error",
        error: "no-key",
      } as const;
    }
    localStorage.setItem("oai-key", key);
  }

  const openai = new OpenAI({
    apiKey: key,
    // this should be ok as we are not exposing any keys
    dangerouslyAllowBrowser: true,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    ...parameters,
  });
  const stream = OpenAIStream(response);
  // Respond with the stream
  const ret = new StreamingTextResponse(stream);
  const data = await ret.text();
  return {
    status: "ok",
    result: data,
  } as const;
}
