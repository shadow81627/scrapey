import getHtml from '../utils/getHtml';
import Thing from '../models/Thing';
import { processHtml } from './processHtml';

async function scrape(url: string): Promise<undefined | Thing> {
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });
    return processHtml(url, html);
  } catch (error) {
    console.log(error);
  }
}

export default scrape;
