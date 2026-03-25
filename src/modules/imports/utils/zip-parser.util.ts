import * as yauzl from 'yauzl';

export async function extractCsvFromZipBuffer(zipBuffer: Buffer): Promise<Record<string, Buffer>> {
  return new Promise((resolve, reject) => {
    const files: Record<string, Buffer> = {};
    yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName) || entry.fileName.includes('__MACOSX')) {
          zipfile.readEntry(); // skip directory and junk
        } else {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);
            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            readStream.on('end', () => {
              const fileName = entry.fileName.split('/').pop() || entry.fileName;
              files[fileName] = Buffer.concat(chunks);
              zipfile.readEntry();
            });
            readStream.on('error', (err) => reject(err));
          });
        }
      });

      zipfile.on('end', () => resolve(files));
      zipfile.on('error', (err) => reject(err));
    });
  });
}
