import { In, IsNull, Raw } from "typeorm";
import { Url } from "../db/entity/Url";
import getOrCreateConnection from "./getOrCreateConnection";

const allowedHosts = ['shop.coles.com.au', 'woolworths.com.au', 'budgetbytes.com', 'connoisseurusveg.com'];

export default async function getNextCrawlUrl(): Promise<string | undefined> {
  const connection = await getOrCreateConnection();
  return (
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
      order: {
        dated: {
          createdAt: 'ASC'
        }
      },
    })
  )?.url;
}