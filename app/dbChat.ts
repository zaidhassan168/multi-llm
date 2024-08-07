import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: '',
  baseURL: "https://llm.mdb.ai",
  dangerouslyAllowBrowser: true
});

export async function dbChat() {
    console.log('in function db chat')

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }, {role: "user", content: "Hello!"}],
        model: "<name of the mind that you created>",
        stream: false,
      })
      console.log(completion.choices[0].message.content);

    return completion.choices[0].message.content;
     
}
