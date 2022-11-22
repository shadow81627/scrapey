import getFiles from './src/utils/getFiles';

(async () => {
  const files = [];
  for await (const filename of getFiles('content')) {
    files.push(filename);
  }
  console.log('files', files.length);
})();
