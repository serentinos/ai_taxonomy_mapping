import { parseCSVFile } from "./getCsvFile";
import { getEmbeddingsObject } from "./getEmbeddings";
import { computeEmbeddings } from "./computeEmbeddings";
import { createObjectCsvWriter } from 'csv-writer';
import minimist from 'minimist';
import path from "path";


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

async function mapCategories(parsedObjects: parsedObjects[], baseTaxonomyPath: string) {
  const ownEmbeddingsComplete = await getEmbeddingsObject(baseTaxonomyPath);
  const ownEmbeddings = ownEmbeddingsComplete.map(({ embeddings }) => embeddings);
  const ownCombined = ownEmbeddingsComplete.map(({ combinedText }) => combinedText);
  const finalObject: any = {};
  const readyToParseObjects = parsedObjects.map(({src_pt, src_cat, src_sc}) => (`${src_pt || ''}||${src_cat || ''}||${src_sc || ''}`).trim());
  const parsedEmbeddingObjects = await computeEmbeddings(readyToParseObjects);

  console.log('Calculating best matches...');

  readyToParseObjects.forEach(async (parsedCombined, index) => {
    const bestMatchMapped = await findBestMatch(parsedEmbeddingObjects[index], ownEmbeddings, ownCombined);
    finalObject[parsedCombined] = bestMatchMapped;
  });

  return finalObject;
}

function getPathToFile() {
  const args = minimist(process.argv.slice(2));
  console.log(args);

  const pathToFile = args['file-to-map-path'];
  const baseTaxonomyPath = args['base-taxonomy-path'];
  console.log(pathToFile, baseTaxonomyPath)

  if (!pathToFile) {
    throw new Error('Please provide path to taxonomy to map')
  }

  if (!baseTaxonomyPath) {
    throw new Error('Please provide path to base taxonomy')
  }
  return {
    pathToFile,
    baseTaxonomyPath
  }
}


(async () => {
  const { baseTaxonomyPath, pathToFile } = getPathToFile()
  const targetFile = pathToFile;
  let parsedObjects = await parseCSVFile<parsedObjects>(targetFile);

  parsedObjects = parsedObjects.map(items => ({
    ...items,
    src_cat: extractLinkName(items.src_cat),
    src_pt: extractLinkName(items.src_pt),
    src_sc: extractLinkName(items.src_sc)
  }))
  
  const mappedData = await mapCategories(parsedObjects, baseTaxonomyPath);

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
    path: path.resolve(
      __dirname,
      'mapped_taxonomies',
      targetFile.split('/').slice(-1)[0].replace('.csv', '') + ' ai mapped.csv'
    ),
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
      console.log('CSV file successfully processed and created');
    })
    .catch((error) => {
      console.error('Error writing to CSV file:', error);
    });
})()
