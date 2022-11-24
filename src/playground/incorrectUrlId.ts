import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

export default async function incorrectUIrlIds(): Promise<void> {
  const connection = AppDataSource;
  console.log('fetch all urls to check id');
  const links = await connection.manager.find(Url, {
    relations: { canonical: true },
  });
  const newIds = [];
  const linksToDelete: Url[] = [];
  let iteration = 0;
  console.log('total urls to check for incorrect id', links.length);
  for (const link of links) {
    iteration++;
    const canonicalId = Url.generateId(Url.urlToParts(link.url));
    if (canonicalId !== link.id) {
      const foundCanonical = links.find((link) => link.id === canonicalId);
      if (foundCanonical) {
        if (!link.canonical) {
          link.canonical = foundCanonical;
          await connection.manager.save(link);
        }
      }
      if (link.canonical && link.canonical.id && link.canonical.id !== link.id) {
        linksToDelete.push(link);
      }
      newIds.push(canonicalId);
    }
  }
  console.log('incorrect url id', newIds.length);
  console.log('soft delete', linksToDelete.length, 'incorrect id links')
  await connection.manager.softRemove(linksToDelete);
}
