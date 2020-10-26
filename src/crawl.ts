import { promises as fs } from 'fs'
import cheerio from 'cheerio';
import getHtml from './utils/getHtml';

const crawled: Array<string> = [];

async function crawl(url: string, origin = new URL(url).origin) {
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });

    console.log(url);
    crawled.push(url);
    await fs.appendFile('scrape/urls.txt', `${url}\n`);

    const $ = cheerio.load(html);
    // get a unique list of valid urls on the same origin
    const links = $('a[href]')
      .map((_, e) => {
        try {
          const base = $(e).attr('href');
          if (base) {
            const url = new URL(base, origin);
            const href = `${url.origin}${url.pathname}`;
            if (url.origin === origin && !crawled.includes(href)) {
              return href;
            }
          }
        } catch (_) {
          // invalid url
        }
      })
      .get();

    for (const link of links) {
      await crawl(link, origin);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Main top level async/await
 */
(async () => {
  const url =
    'https://www.woolworths.com.au/shop/productdetails/29411/sanofi-hydrogen-peroxide';
  await crawl(url);
})();
