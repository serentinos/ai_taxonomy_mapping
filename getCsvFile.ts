import csvParser from "csv-parser";
import fs from 'fs';

export const parseCSVFile = <T>(pathname: string): Promise<T[]> => {
  const data: T[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathname)
      .pipe(csvParser())
      .on('data', (row) => {
        data.push(row)
      })
      .on('end', () => {
        resolve(data)
      })
      .on('error', (e) => {
        reject(e.message);
      })
  })
}
