import yargs from 'yargs';
import scrape from './scrape';
import { getFileUrlMap } from './scrape/getFileUrlMap';
import { processLinkData } from './scrape/processLinkData'

const argv = yargs
  .command('scrape', 'Crawl urls with browser', {})
  .option('scrape', {
    alias: 's',
    description: 'Crawl urls with browser',
    type: 'boolean',
    default: true,
  })
  .option('only-new', {
    alias: 'n',
    description: 'Only use default urls',
    type: 'boolean',
    default: false,
  })
  .option('collection', {
    alias: 'c',
    description: 'Collection',
    type: 'string',
    default: '',
  })
  .option('url', {
    alias: 'u',
    description: 'URL',
    type: 'string',
    default: '',
  })
  .help()
  .alias('help', 'h').argv;

/**
 * Handy regex for selecting hrefs
 * Regex: "(https:\/\/www.budgetbytes.com\/.[^"]+)"
 * example: <a href="https://www.budgetbytes.com/black-bean-avocado-enchiladas/"],>[
 */

/**
 * Main top level async/await
 */
(async () => {
  const fileUrlMap = argv.url ? new Map() : await getFileUrlMap(argv);
  const tempFileNameMap: Map<string, string[]> = new Map();
  for (const [url, filename] of fileUrlMap.entries()) {
    tempFileNameMap.set(filename, [...tempFileNameMap.get(filename) ?? [], url]);
  }
  const urls: string[][] = argv.url ? [[argv.url]] : Array.from(tempFileNameMap.values()) ?? [];
  const total = urls.length;

  // crawl urls
  for (const [index, chunk] of urls.entries()) {
    const chunkData = [];
    if (argv.scrape) {
      for (const url of chunk) {
        const currentIndex = `${index + 1}`.padStart(`${total}`.length, '0');
        console.log(`${currentIndex}/${total}`, url);
        const linkData = await scrape(url);
        if (linkData) {
          chunkData.push(linkData);
        }
      }
    }

    await processLinkData({ chunk, chunkData, fileUrlMap, argv });
  }
})();
