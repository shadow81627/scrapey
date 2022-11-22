import cheerio from 'cheerio';
import getHtml from './utils/getHtml';
import { createConnection, getConnection, In, IsNull, Raw } from 'typeorm';
import { Url } from './db/entity/Url';
import _ from 'lodash';
import { processHtml } from './scrape/processHtml';
import { processLinkData } from './scrape/processLinkData';
import { CrawlIssue } from './db/entity/CrawlIssue';

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }

  return true;
}

const allowedHosts = ['shop.coles.com.au', 'woolworths.com.au'];
const disallowedHosts = [
  'twitter.com',
  'facebook.com',
  'pinterest.com',
  'woolworthsrewards.com.au',
];
let iteration = 0;

async function crawl(url: string) {
  iteration++;
  console.log(iteration, url);
  const hostname = new URL(url).hostname;
  const connection = getConnection();
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });

    const $ = cheerio.load(html);

    const canonicalHref = $('link[rel="canonical"]').attr('href');
    const canonical =
      canonicalHref && isValidUrl(canonicalHref) ? canonicalHref : url;
    // save fetched url
    const data = processHtml(url, html);
    if (data) {
      processLinkData({
        chunk: [canonical],
        chunkData: [data],
        fileUrlMap: new Map(),
        argv: { scrape: true },
      });
    }

    const urlParts = Url.urlToParts(url);
    const dbCanonical =
      (await connection.manager.findOne(Url, {
        where: [{ id: Url.generateId(Url.urlToParts(canonical)) }],
        relations: ['urls'],
      })) ??
      (await connection.manager.save(new Url(Url.urlToParts(canonical))));
    await connection.manager.save(
      new Url({ ...urlParts, crawledAt: new Date(), canonical: dbCanonical }),
    );
    dbCanonical.crawledAt = new Date();
    await connection.manager.save(dbCanonical);

    // console.log(iteration, dbCanonical.url);
    // TODO set all non canonical urls to crawled as well

    // get a unique list of valid urls on the same origin
    const links: string[] = _.uniq(
      $('a[href]')
        .map((_, e) => {
          try {
            const href = $(e).attr('href');
            if (
              href &&
              (href.startsWith('http') ||
                href.startsWith('/') ||
                href.startsWith('://'))
            ) {
              return Url.getUrl(new URL(href, `https://${hostname}`));
            }
          } catch (_) {
            // invalid url
          }
        })
        .get(),
    )
      .filter(Boolean)
      .filter((link) => !disallowedHosts.includes(new URL(link).hostname))
      .filter(
        (link) =>
          !link.startsWith('https://woolworths.com.au/shop/printrecipe'),
      );

    try {
      dbCanonical.urls = await Promise.all(
        links.map((link) =>
          connection.manager.save(new Url(Url.urlToParts(link))),
        ),
      );
      await connection.manager.save(dbCanonical);
    } catch (e) {
      console.log(e.message);
    }
  } catch (error) {
    console.log('Error', error);
    const dbUrl =
      (await connection.manager.findOne(Url, {
        where: [{ id: Url.generateId(Url.urlToParts(url)) }],
        relations: ['urls'],
      })) ?? (await connection.manager.save(new Url(Url.urlToParts(url))));
    dbUrl.crawledAt = new Date();
    const issue = new CrawlIssue();
    issue.name = error.name;
    issue.description = error.message;
    issue.url = dbUrl;
    await connection.manager.save(dbUrl);
    await connection.manager.save(issue);
  }

  const link = (
    await connection.manager.findOne(Url, {
      where: [
        {
          crawledAt: IsNull(),
          hostname: In(allowedHosts),
          canonical: IsNull(),
        },
        {
          crawledAt: IsNull(),
          hostname: In(allowedHosts),
          canonical: Raw('canonicalId'),
        },
      ],
    })
  )?.url;

  if (link) {
    await crawl(link);
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
  const url = (
    await connection.manager.findOne(Url, {
      where: [
        {
          crawledAt: IsNull(),
          hostname: In(allowedHosts),
          canonical: IsNull(),
        },
        {
          crawledAt: IsNull(),
          hostname: In(allowedHosts),
          canonical: Raw('canonicalId'),
        },
      ],
      // order: {
      //   dated.createdAt: 'ASC'
      // }
    })
  )?.url;
  if (url) {
    await crawl(url);
  }
  await connection.close();
})();
