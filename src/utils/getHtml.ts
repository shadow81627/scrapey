import { firefox } from 'playwright';
import { promises as fsPromises } from 'fs';
import deepSort from './deepSort';
import { sortBy } from 'lodash';
const { readFile, writeFile } = fsPromises;

interface getHtmlArgs {
  url: string;
}

export default async function getHtml({ url }: getHtmlArgs): Promise<string> {
  const browserOptions = {
    headless: true,
    slowMo: 250,
    waitUntil: 'networkidle0',
    defaultViewport: null,
    proxy: { server: 'http://localhost:11111' }
  };
  const timeout = 120000; // timeout in milliseconds.
  const waitForTimeout = 15000;
  const browser = await firefox.launch(browserOptions);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    // fetch browser rendered html
    const page = await context.newPage();

    const deserializedCookies = JSON.parse(
      (await readFile('cookies.json')).toString(),
    );
    await context.addCookies(deserializedCookies);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(waitForTimeout);

    const cookies = await context.cookies();
    const cookieJson =
      JSON.stringify(sortBy(deepSort(cookies), 'name'), undefined, 2) + '\n';
    writeFile('cookies.json', cookieJson);

    return await page.content();
  } finally {
    await browser.close();
  }
}
