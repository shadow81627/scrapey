import probe from "probe-image-size";
import AppDataSource from '../db/data-source';
import { Image } from '../db/entity';

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0';

export default async function probeImage(image: Image): Promise<void> {
  const connection = AppDataSource;
  const link = image.url;
  try {
    const { width, height, mime } = await probe(link.url, {
      user_agent: userAgent,
      rejectUnauthorized: false,
      proxy: 'http://localhost:11111',
    });
    connection.manager.merge(Image, image, { width, height, mime });
    link.crawledAt = new Date();
    await connection.manager.save(image);
  } catch (e) {
    console.error(e);
    link.crawledAt = new Date();
    await connection.manager.save(link);
  }
}