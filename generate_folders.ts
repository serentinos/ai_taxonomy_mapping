import path from "path";
import fs from 'fs';

function checkAndCreateFolders() {
  const foldersToCheck = ['mapped_taxonomies', 'base_taxonomy_embeddings', 'base_taxonomy'];
  foldersToCheck.forEach(folder => {
      const folderPath = path.join(__dirname, folder);
      if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
          console.log(`Created folder: ${folder}`);
      } else {
          console.log(`Folder already exists: ${folder}`);
      }
  });
}

checkAndCreateFolders();