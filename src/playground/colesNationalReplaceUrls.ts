import { Like, Not } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

export default async function colesNationalReplaceUrls(): Promise<void> {
  const connection = AppDataSource;
  const links = await connection
    .getRepository(Url)
    .createQueryBuilder('url')
    .where({ pathname: Like('/a/%/%') })
    .andWhere({
      pathname: Not(Like('/a/a-national/%')),
    })
    .andWhere({
      pathname: Not(Like('/a/everything/%')),
    })
    .andWhere({
      pathname: Not(Like('/a/bought-before/%')),
    })
    .andWhere({
      pathname: Not(Like('/a/specials/%')),
    })
    .andWhere({
      pathname: Not(Like('/a/national/%')),
    })
    .getMany();

  console.log('coles national replace total', links.length);
  const regex = /^\/a\/(.+?)\//;
  let iteration = 0;
  for (const link of links) {
    iteration++;
    const replaced = link.pathname?.replace(regex, '/a/national/');
    if (replaced !== link.pathname) {
      link.pathname = replaced;
      link.crawledAt = null;
      link.duration = null;
      // await connection.manager.save(link);
      console.log(iteration, link.url);
    }
  }
}
