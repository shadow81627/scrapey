import cheerio from 'cheerio';
import getHtml from './utils/getHtml';
import { createConnection, getConnection, In, IsNull, Raw } from 'typeorm';
import { Url } from './db/entity/Url';
import _ from 'lodash';
import { processHtml } from './scrape/processHtml';
import { processLinkData } from './scrape/processLinkData';

const allowedHosts = ['shop.coles.com.au', 'woolworths.com.au'];
let iteration = 0;

async function crawl(url: string) {
  const hostname = new URL(url).hostname;
  iteration++
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });

    const $ = cheerio.load(html);

    const canonical = $('link[rel="canonical"]').attr("href") || url;
    console.log(iteration, canonical);
    // save fetched url
    const connection = getConnection();
    const urlParts = Url.urlToParts(url);
    const data = processHtml(url, html);
    if (data) {
      processLinkData({ chunk: [canonical], chunkData: [data], fileUrlMap: new Map(), argv: { scrape: true } })
    }
    const dbCanonical = await connection.manager.save(new Url(Url.urlToParts(canonical)));
    await connection.manager.save(new Url({ ...urlParts, crawledAt: new Date(), canonical: dbCanonical }));

    // get a unique list of valid urls on the same origin
    const links: string[] = _.uniq($('a[href]')
      .map((_, e) => {
        try {
          const href = $(e).attr('href');
          if (href && (href.startsWith('http') || href.startsWith('/') || href.startsWith(':'))) {
            return Url.getUrl(new URL(href, `https://${hostname}`));
          }
        } catch (_) {
          // invalid url
        }
      })
      .get()).filter(Boolean);

    dbCanonical.urls = await Promise.all(links.map(link => connection.manager.save(new Url(Url.urlToParts(link)))));
    await connection.manager.save(dbCanonical);

    const link = (await connection.manager.findOne(Url, {
      where: [
        { crawledAt: IsNull(), hostname: In(allowedHosts), canonical: IsNull() },
        { crawledAt: IsNull(), hostname: In(allowedHosts), canonical: Raw("canonicalId") }
      ],
      // order: {
      //   createdAt: 'ASC'
      // }
    }))?.url;

    if (link) {
      const href = new URL(link)
      const id = Url.generateId(Url.urlToParts(link));
      const found = await connection.manager.findOne(Url, id);
      if (href.hostname === hostname && !found?.crawledAt) {
        await crawl(link);
      }
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
  // const url =
  //   'https://shop.coles.com.au/a/national/everything/browse';
  const connection = await createConnection();
  const url = (await connection.manager.findOne(Url, {
    where: [
      { crawledAt: IsNull(), hostname: In(allowedHosts), canonical: IsNull() },
      { crawledAt: IsNull(), hostname: In(allowedHosts), canonical: Raw("canonicalId") }
    ],
    // order: {
    //   dated.createdAt: 'ASC'
    // }
  }))?.url;
  if (url) {
    await crawl(url);
  }
})();
