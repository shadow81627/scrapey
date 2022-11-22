import 'reflect-metadata';
import getFiles from '../../utils/getFiles';
import { Pool, spawn, Worker } from 'threads';
import path from 'path';
import getOrCreateConnection from '../../utils/getOrCreateConnection';

/**
 * Main top level async/await
 */
(async () => {
  const connection = await getOrCreateConnection();
  const files = [];
  for await (const filename of getFiles('content')) {
    files.push(filename);
  }
  const totalFiles = files.length;
  const pool = Pool(() => spawn(new Worker('./worker.ts')));
  let iteration = 0;
  for (const file of files) {
    pool.queue(async (loadDB) => {
      iteration++;
      await loadDB(file);
      console.log(
        `${String(iteration).padStart(String(totalFiles).length, '0')}/${String(
          totalFiles,
        )}`,
        path.relative(process.cwd(), file),
      );
    });
  }
  await pool.completed();
  await pool.terminate();
  await connection.close();
})();
