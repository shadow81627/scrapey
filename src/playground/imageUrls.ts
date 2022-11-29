import probe from 'probe-image-size';
import { IsNull, Like } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Image, Url } from '../db/entity';
import probeImage from '../utils/probeImage';
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0';

export default async function probeImages(): Promise<string> {
  const connection = AppDataSource;
  const name = 'urls to check if image';
  console.log(`fetching all ${name}`);
  const [links, total] = await connection.manager.findAndCount(Url, {
    where: {
      crawledAt: IsNull(),
      pathname: Like('%.jpg'),
    }
  });
  const probed = [];
  console.log(`total ${name}`, total);
  for (const link of links) {
    if (!link.crawledAt) {
      const image =
            (await connection.manager.findOne(Image, {
              where: [{ url: { id: link.id } }],
              relations: { url: true },
            })) ?? connection.manager.create(Image, { url: link });
      await probeImage(image);
      probed.push(image);
    }
  }
  const response = `urls to checked if image ${probed.length}`;
  return response;
}
