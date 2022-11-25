import AppDataSource from "../db/data-source";
import { Url } from "../db/entity";

export default async function resetRedirectedColesUrls(): Promise<string> {
  console.log('fetch redirected coles urls to reset');
  const connection = AppDataSource;
  const links = await connection.manager.find(Url, {
    relations: { canonical: true },
    where: {
      canonical: { id: '5c3954dd-4c02-5b3e-a8be-42bde5a02dc6'}
    }
  });
  const response = `total redirected coles urls ${links.length}`
  console.log(response)
  for (const link of links) {
    link.canonical = null;
    link.crawledAt = null;
    link.duration = null;
    // await connection.manager.save(link);
  }
  return response;
}