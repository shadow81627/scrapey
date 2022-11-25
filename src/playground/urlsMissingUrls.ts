import { IsNull, Not } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

/**
 * Check if a url has stored any urls. If missing urls likely means the page had
 * issues being crawled e.g got blocked or hit a transient error.
 * @returns
 */
export default async function urlsMissingUrls(): Promise<string> {
  const connection = AppDataSource;
  console.log('fetch crawled urls to check missing urls');
  const [links, total] = await connection.manager.findAndCount(Url, {
    relations: {
      // urls: true
      image: true,
    },
    where: {
      crawledAt: Not(IsNull()),
      image: IsNull(),
    },
  });
  const empties = [];
  console.log('total urls to check for missing urls', total);
  let iteration = 0;
  for (const link of links) {
    iteration++;
    const image = await link.image;
    const things = await link.things;
    if (!image && !things && link.crawledAt) {
      const urls = await link.urls;
      if (!urls || !urls.length) {
        empties.push(link);
        console.log(iteration, link.url);
        link.crawledAt = null;
        link.duration = null;
        // await connection.manager.save(link);
      }
    }
  }
  const response = `urls missing urls ${empties.length}`;
  console.log('urls missing urls', empties.length);
  return response;
}
