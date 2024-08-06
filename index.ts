import { parseCSVFile } from "./getCsvFile";
import { getEmbeddingsObject } from "./getEmbeddings";
import { computeEmbeddings } from "./computeEmbeddings";
import { createObjectCsvWriter } from 'csv-writer';

function extractLinkName(input: string) {
  const hyperlinkPattern = /=HYPERLINK\(".*?",\s*"(.*?)"\)/;
  
  const match = input.match(hyperlinkPattern);
  
  return match ? match[1] : input;
}

interface parsedObjects {
  src_pt: string,
  src_cat: string,
  src_sc: string
  count: string,
  status: string,
  ent_pt_2: string,
  ent_cat_2: string,
  ent_sc_2: string,
  notes: string,
}

interface ownCategories {
  ent_pt_2: string,
  ent_cat_2: string,
  ent_sc_2: string,
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function to find the best match for a single parsed object
async function findBestMatch(parsedEmbedding: number[], ownEmbeddings: number[][], ownCategories: string[]) {
  let bestMatch = null;
  let highestScore = -1;

  for (let i = 0; i < ownEmbeddings.length; i++) {
    const score = cosineSimilarity(parsedEmbedding as any, ownEmbeddings[i] as any);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = ownCategories[i];
    }
  }

  return {
    bestMatch: bestMatch,
    score: highestScore,
  };
}

// Function to map parsed objects to own categories based on combined context
async function mapCategories(parsedObjects: parsedObjects[]) {
  // Concatenate the fields for own categories and compute embeddings
  const ownEmbeddingsComplete = await getEmbeddingsObject('base_taxonomy/UPC Taxonomy 2.5 - 2.5 Taxonomy (1).csv');
  const ownEmbeddings = ownEmbeddingsComplete.map(({ embeddings }) => embeddings);
  const ownCombined = ownEmbeddingsComplete.map(({ combinedText }) => combinedText);
  const finalObject: any = {};
  const readyToParseObjects = parsedObjects.map(({src_pt, src_cat, src_sc}) => (`${src_pt || ' '}||${src_cat || ' '}||${src_sc || ' '}`).trim());
  const parsedEmbeddingObjects = await computeEmbeddings(readyToParseObjects);

  readyToParseObjects.forEach(async (parsedCombined, index) => {
    const bestMatchMapped = await findBestMatch(parsedEmbeddingObjects[index], ownEmbeddings, ownCombined);
    finalObject[parsedCombined] = bestMatchMapped;
  });

  return finalObject;
}

//Example usage
(async () => {
  const targetFile = 'UPC_ Discount School Supply - taxonomy.csv';
  let parsedObjects = await parseCSVFile<parsedObjects>(targetFile);

  parsedObjects = parsedObjects.map(items => ({
    ...items,
    src_cat: extractLinkName(items.src_cat),
    src_pt: extractLinkName(items.src_pt),
    src_sc: extractLinkName(items.src_sc)
  }))
  
  const mappedData = await mapCategories(parsedObjects);

  const finalObject = parsedObjects.map((data) => {
    const {src_pt, src_sc, src_cat} = data;
    const key = `${src_pt}||${src_cat}||${src_sc}`;
    const foundedMapped = mappedData[key];
    const [mapped_src_pt, mapped_src_cat, mapped_src_sc] = foundedMapped.bestMatch.split('||')
    return {
      ...data,
      ent_pt_2: mapped_src_pt,
      ent_cat_2: mapped_src_cat,
      ent_sc_2: mapped_src_sc,
      score: foundedMapped.score
    }
  })

  const csvWriter = createObjectCsvWriter({
    path: targetFile.replace('.csv', '') + ' ai mapped.csv',
    header: [
      { id: 'src_pt', title: 'src_pt' },
      { id: 'src_cat', title: 'src_cat' },
      { id: 'src_sc', title: 'src_sc' },
      { id: 'count', title: 'count' },
      { id: 'status', title: 'status' },
      { id: 'ent_pt_2', title: 'ent_pt_2' },
      { id: 'ent_cat_2', title: 'ent_cat_2' },
      { id: 'ent_sc_2', title: 'ent_sc_2' },
      { id: 'notes', title: 'notes' },
      { id: 'score', title: 'score' },
    ]
  })

  csvWriter.writeRecords(finalObject)
    .then(() => {
      console.log('CSV file successfully processed and created.');
    })
    .catch((error) => {
      console.error('Error writing to CSV file:', error);
    });
})()
