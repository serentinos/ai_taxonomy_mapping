import { computeEmbeddings } from "./computeEmbeddings";
import { parseCSVFile } from "./getCsvFile";
import fs from 'fs';

export interface ownCategories {
  productType: string,
  category: string,
  subCategory: string,
}

export interface embeddingsCombined {
  combinedText: string,
  embeddings: number[],
}

function saveJsonToFile(json: string, filePath: string) {
  try {
    fs.writeFileSync(filePath, json, 'utf-8',);
    console.log('Successfuly saved file');
  } catch (error) {
    console.log('Error occured while saving file')
  };
}

export const getEmbeddingsObject = async (baseTaxonomyPath: string): Promise<embeddingsCombined[]> => {
  const fileName = baseTaxonomyPath.split('/').slice(-1)[0].split('.').slice(0, -1).join('.');
  const savedEmbedingsPath = `base_taxonomy_embeddings/${fileName}_embeddings.json`;

  let embeddingsData;

  try {
    embeddingsData = fs.readFileSync(savedEmbedingsPath, 'utf-8');
    embeddingsData = JSON.parse(embeddingsData) as embeddingsCombined[];
    return embeddingsData;

  } catch (error) {
    console.log('Cant find embeddings for current file, regenerating...')
    const parsedData = await parseCSVFile<ownCategories>(baseTaxonomyPath);

    const combinedTexts = parsedData.map(cat => `${cat.productType}||${cat.category}||${cat.subCategory}`);
    const computedEmbedings = await computeEmbeddings(combinedTexts);
    const combinedTextsWithComputed = combinedTexts.map((text, index) => ({
      combinedText: text,
      embeddings: computedEmbedings[index]
    }))
    saveJsonToFile(JSON.stringify(combinedTextsWithComputed), savedEmbedingsPath)

    return combinedTextsWithComputed;
  }
}
