import { firefox } from 'playwright';

interface getHtmlArgs {
  url: string;
}

export default async function getHtml({ url }: getHtmlArgs): Promise<string> {
  const browserOptions = {
    headless: false,
    slowMo: 250,
    waitUntil: 'networkidle0',
    defaultViewport: null,
  };
  const timeout = 120000; // timeout in milliseconds.
  const waitForTimeout = 15000;
  const browser = await firefox.launch(browserOptions);
  try {
    // fetch browser rendered html
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(waitForTimeout);
    return await page.content();
  } finally {
    await browser.close();
  }
}
