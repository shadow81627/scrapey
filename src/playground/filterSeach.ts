import { Like } from "typeorm";
import AppDataSource from "../db/data-source";
import { Url } from "../db/entity";

export default async function filterSearchParams(): Promise<void> {
  const disallowedParams = [
    'adobe_mc',
  ]
  const connection = AppDataSource;
  const [links, total] = await connection.manager.findAndCount(Url, {
    where: [{ search: Like('%adobe_mc%') }],
  });
  console.log('total', total);
  for (const link of links) {
    const filteredSearch = new URLSearchParams(link.search ?? '')
    disallowedParams.forEach(param => filteredSearch.delete(param))
    link.search = filteredSearch.toString();
  }
  // await connection.manager.save(links)
}