export let assistantId = "asst_H5tcA7ncqblEgefQPuD0EZQ9"; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID ?? "";
}
