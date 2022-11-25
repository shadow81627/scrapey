import { In } from "typeorm";
import AppDataSource from "../db/data-source";
import { Url } from "../db/entity";

export default async function deleteDisallowedDomains(): Promise<string> {
  const disallowedHosts = [
    'twitter.com',
    'facebook.com',
    'pinterest.com',
    'woolworthsrewards.com.au',
    'mobile.woolworths.com.au',
    'woolworthsatwork.com.au',
  ];
  const connection = AppDataSource;
  const links = await connection.manager.find(Url, {
    where: [
      {
        hostname: In(disallowedHosts),
      },
    ],
  });
  await connection.manager.softRemove(links);
  const response = `soft delete ${links.length}`;
  console.log(response);
  return response;
}
