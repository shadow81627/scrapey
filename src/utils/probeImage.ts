import probe from "probe-image-size";
import AppDataSource from '../db/data-source';
import { Image } from '../db/entity';
import parseHrtimeToSeconds from "./parseHrtimeToSeconds";

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0';

export default async function probeImage(image: Image): Promise<void> {
  const probeStartTime = process.hrtime();
  const connection = AppDataSource;
  const link = image.url;
  try {
    const { width, height, mime } = await probe(link.url, {
      user_agent: userAgent,
      rejectUnauthorized: false,
      proxy: 'http://localhost:11111',
    });
    connection.manager.merge(Image, image, { width, height, mime });
  } catch (e) {
    console.error('Image Probe Error:', link.url, e);
  } finally {
    const duration = Number(parseHrtimeToSeconds(process.hrtime(probeStartTime)));
    link.crawledAt = new Date();
    link.duration = duration;
    await connection.manager.save(link);
  }
}