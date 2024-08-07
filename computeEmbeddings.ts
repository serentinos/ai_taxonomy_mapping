import OpenAI from "openai"
import 'dotenv/config';



const apiKey = process.env.OPEN_API_KEY || '';

const openAiApi = new OpenAI({
  apiKey: apiKey,
})

function splitArray(array: any[], chunkSize: number) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function reconstructArray(chunks: any[]) {
  return chunks.flat(); 
}

export async function computeEmbeddings(text: string[]) {
  const splitedInput = splitArray(text, 200);

  const results = await Promise.all(splitedInput.map((data) => (
    openAiApi.embeddings.create({
      model: 'text-embedding-3-large',
      input: data,
    })
  )));

  const tokensUsed = results.reduce((sum, result) => sum + result.usage.total_tokens, 0);

  console.log(`Tokens used: ${tokensUsed}`);
  const embeddings = results.map(responce => responce.data.map(data => data.embedding));

  return reconstructArray(embeddings);
}