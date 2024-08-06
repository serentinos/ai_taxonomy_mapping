import OpenAI from "openai"

const apiKey = 'sk-KSJodPqprr1tmR5zhL9WUg2gS4qwzp9b1bpysT_h0RT3BlbkFJhQDnbFks2tydTsLorjOz1mbAwZ6WqcPE0tY1VAoVoA';

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
  return chunks.flat(); // Using flat() to merge the chunks into a single array
}

export async function computeEmbeddings(text: string[]) {
  console.log('input', text)

  const splitedInput = splitArray(text, 200);

  const results = await Promise.all(splitedInput.map((data) => (
    openAiApi.embeddings.create({
      model: 'text-embedding-3-large',
      input: data,
    })
  )));

  const embeddings = results.map(responce => responce.data.map(data => data.embedding));


  return reconstructArray(embeddings);
}