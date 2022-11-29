import { IsNull } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Image } from '../db/entity';
import probeImage from '../utils/probeImage';

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
    if (!link.crawledAt) {
      await probeImage(image);
      probed.push(image);
    }
  }
  const response = `images probed ${probed.length}`;
  return response;
}
