export let assistantId = "asst_gGNFbArGOeCaXvkwooBbzsYr"; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID ?? "";
}
