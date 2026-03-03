import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const askBedrock = async (messages) => {
  const systemMessage =
    "You are a friendly AI tutor helping elementary school students.";

  try {
    const conversation = messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    const command = new ConverseCommand({
      modelId: "meta.llama3-8b-instruct-v1:0",
      system: [{ text: systemMessage }],
      messages: conversation,
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.3,
        topP: 0.9,
      },
    });

    const response = await client.send(command);
    return response.output.message.content[0].text || "";
  } catch (error) {
    console.error("Bedrock API Error:", error);
    throw new Error("Failed to generate AI response");
  }
};
