export let assistantId = "asst_pE8LyA8VWIbTZZ7WKzeH0kD6"; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID ?? "";
}
