import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

/**
 * Fetch duplicate urls from database set canonical ids and then soft delete non canonical urls.
 */
export default async function colesNationalReplaceUrls(): Promise<void> {
  const connection = AppDataSource;
  const linksToDelete: Url[] = [];
  const duplicates = await connection
    .getRepository(Url)
    .createQueryBuilder('url')
    .select('hostname, pathname, search')
    .groupBy('hostname, pathname, search')
    .having('COUNT(*) > 1')
    .getRawMany();
  console.log('total duplicates', duplicates.length);
  let iterationDuplicate = 0;
  for (const { hostname, pathname, search } of duplicates) {
    iterationDuplicate++;
    console.log('duplicate', iterationDuplicate, hostname, pathname, search);
    const links = await connection.manager.find(Url, {
      relations: { canonical: true },
      where: {
        hostname,
        pathname,
        search,
      },
    });
    let linkIterations = 0;
    const canonicalId = Url.generateId({ hostname, pathname, search });
    const foundCanonical = links.find((link) => link.id === canonicalId);
    if (!foundCanonical) {
      console.log('todo create canonical', canonicalId);
    }
    for (const link of links) {
      linkIterations++;
      console.log('    link', linkIterations, link.url);
      if (foundCanonical) {
        if (!link.canonical) {
          link.canonical = foundCanonical;
          await connection.manager.save(link);
        }
      }
      if (link.canonical && link.canonical.id && link.canonical.id !== link.id) {
        linksToDelete.push(link);
      }
    }
  }
  console.log('soft delete', linksToDelete.length, 'duplicate links')
  await connection.manager.softRemove(linksToDelete);
}
