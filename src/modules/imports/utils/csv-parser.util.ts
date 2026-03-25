import * as csv from 'csv-parser';
import { Readable } from 'stream';

export async function parseCsvBuffer<T>(buffer: Buffer): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}
