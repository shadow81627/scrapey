import probe from 'probe-image-size';
import { IsNull } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Image } from '../db/entity';
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0';

export default async function probeImages(): Promise<string> {
  const connection = AppDataSource;
  console.log('fetching all images to probe');
  const [images, total] = await connection.manager.findAndCount(Image, {
    relations: ['url'],
    where: {
      url: {
        crawledAt: IsNull(),
      },
    },
  });
  const probed = [];
  console.log('total images to probe', total);
  for (const image of images) {
    const link = image.url;
    if (!link.crawledAt && false) {
      try {
        const { width, height, mime } = await probe(link.url, {
          user_agent: userAgent,
          rejectUnauthorized: false,
        });
        connection.manager.merge(Image, image, { width, height, mime });
        link.crawledAt = new Date();
        await connection.manager.save(image);
      } catch (e) {
        console.error(e);
        link.crawledAt = new Date();
        await connection.manager.save(link);
      }
      probed.push(image);
    }
  }
  const response = `images probed ${probed.length}`;
  return response;
}
