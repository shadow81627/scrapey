import cheerio from 'cheerio';
import getHtml from './utils/getHtml';
import { createConnection, getConnection } from 'typeorm';
import { Url } from './db/entity/Url';
import _ from 'lodash';
import { processHtml } from './scrape/processHtml';
import { processLinkData } from './scrape/processLinkData';

async function crawl(url: string, origin = new URL(url).origin) {
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });

    const $ = cheerio.load(html);

    const canonical = $('link[rel="canonical"]').attr("href") || url;
    // save fetched url
    const connection = getConnection();
    const urlParts = Url.urlToParts(canonical);
    const data = processHtml(url, html);
    processLinkData({})
    await connection.manager.save(new Url({ ...urlParts, crawledAt: new Date() }));

    // get a unique list of valid urls on the same origin
    const links: string[] = _.uniq((await Promise.all($('a[href]')
      .map(async (_, e): Promise<string | undefined> => {
        try {
          const href = $(e).attr('href');
          if (href) {
            const url = new URL(href, origin);
            const id = Url.generateId({ ...url });
            const crawled = await connection.manager.findOne(Url, id);
            if (url.origin === origin && !crawled) {
              return Url.getUrl(Url.urlToParts(url.href));
            }
          }
        } catch (_) {
          // invalid url
        }
      })
      .get()))).filter(Boolean);

    for (const link of links) {
      console.log(link)
      // await crawl(link, origin);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Main top level async/await
 */
//     'https://www.woolworths.com.au/shop/productdetails/29411/sanofi-hydrogen-peroxide'
(async () => {
  const url =
    'https://shop.coles.com.au/a/sunnybank-hills/everything/browse';
  await createConnection();
  await crawl(url);
})();
