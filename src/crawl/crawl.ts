import cheerio from 'cheerio';
import getHtml from '../utils/getHtml';
import { Url } from '../db/entity/Url';
import _ from 'lodash';
import { processHtml } from '../scrape/processHtml';
import { processLinkData } from '../scrape/processLinkData';
import { CrawlIssue } from '../db/entity/CrawlIssue';
import isValidUrl from '../utils/isValidUrl';
import { expose } from 'threads/worker';
import AppDataSource from '../db/data-source';
import parseHrtimeToSeconds from '../utils/parseHrtimeToSeconds';

const disallowedHosts = [
  'twitter.com',
  'facebook.com',
  'pinterest.com',
  'woolworthsrewards.com.au',
  'mobile.woolworths.com.au',
  'woolworthsatwork.com.au',
];
export default async function crawl(
  url: string,
): Promise<{ duration: number }> {
  const startTime = process.hrtime();
  const hostname = new URL(url).hostname;
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const connection = AppDataSource;
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
      await processLinkData({
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
        relations: { urls: true },
      })) ?? new Url(Url.urlToParts(canonical));
    const dbUrl = new Url({
      ...urlParts,
      crawledAt: new Date(),
      canonical: dbCanonical,
    });
    dbCanonical.crawledAt = new Date();
    dbCanonical.duration = Number(
      parseHrtimeToSeconds(process.hrtime(startTime)),
    );
    await connection.manager.save(dbCanonical);
    dbUrl.crawledAt = new Date();
    dbUrl.duration = Number(parseHrtimeToSeconds(process.hrtime(startTime)));
    await connection.manager.save(dbUrl);

    // console.log(iteration, dbCanonical.url);
    // TODO set all non canonical urls to crawled as well

    // get a unique list of valid urls on the same origin
    const links: string[] = $('a[href]')
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
      .get()
      .filter(Boolean)
      .filter((link) => !disallowedHosts.includes(new URL(link).hostname))
      .filter(link => !link.match(/^https:\/\/budgetbytes.com\/.+?\/comment-page-\d/))
      .filter(
        (link) =>
          !link.startsWith('https://woolworths.com.au/shop/printrecipe'),
      );

    try {
      const newLinks = links.map((link) => new Url(Url.urlToParts(link)));
      dbCanonical.urls = Promise.resolve(
        _.uniqBy(((await dbCanonical.urls) ?? []).concat(newLinks), function (
          link,
        ) {
          return link.id;
        }),
      );
      await connection.manager.save(dbCanonical);
    } catch (e) {
      console.error('Urls Error', url, e);
    }
  } catch (error) {
    console.error('Error', url, error);
    const dbUrl =
      (await connection.manager.findOne(Url, {
        where: [{ id: Url.generateId(Url.urlToParts(url)) }],
      })) ?? (await connection.manager.save(new Url(Url.urlToParts(url))));
    dbUrl.crawledAt = new Date();
    const issue = new CrawlIssue();
    issue.name = error.name;
    issue.description = error.message;
    issue.url = dbUrl;
    dbUrl.duration = Number(parseHrtimeToSeconds(process.hrtime(startTime)));
    await connection.manager.save(dbUrl);
    await connection.manager.save(issue);
  }
  const duration = Number(parseHrtimeToSeconds(process.hrtime(startTime)));
  return { duration };
}
async function complete() {
  AppDataSource.destroy()
}

const worker = {
  crawl,
  complete,
}
export type Crawler = typeof worker;
expose(worker);
