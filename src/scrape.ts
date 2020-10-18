import fs from 'fs';
import cheerio from 'cheerio';
import slugify from 'slugify';
import he from 'he';
import sortobject from './utils/deepSort';
import _ from 'lodash';
import renameKeys from './utils/renameKeys';
import getHtml from './utils/getHtml';
import Thing from './models/Thing';
import Organization from './models/Organization';
import ImageObject from './models/ImageObject';

const linkDataTypes = ['Product', 'Recipe', 'VideoObject'];

async function scrape(url: string): Promise<undefined | Thing> {
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });

    // parse html and extract data to json file
    const $ = cheerio.load(html, { decodeEntities: true });
    const elements = $('script[type="application/ld+json"]')
      .map((_: number, e: any) => $(e).html())
      .get();

    for (const element of elements) {
      const linkDataHtmlDecoded = he.decode(element);
      const html = cheerio.load(linkDataHtmlDecoded).root().text();
      const parsedData = JSON.parse(html);

      // check graph for recipe
      const linkData =
        parsedData &&
        parsedData['@graph'] &&
        !linkDataTypes.includes(_.upperFirst(parsedData['@type']))
          ? _.find(parsedData['@graph'], { '@type': 'Recipe' })
          : (parsedData as Thing);

      if (
        linkData &&
        linkData['@type'] &&
        linkDataTypes.includes(_.upperFirst(linkData['@type']))
      ) {
        const type = _.upperFirst(linkData['@type']);
        let sameAs = [url];
        // add url to same as to use a reference
        if (linkData.sameAs) {
          sameAs = sameAs.concat(linkData.sameAs);
        }
        // remove author is name has no length
        if (linkData.author && !linkData.author.name) {
          linkData.author = undefined;
        }
        if (type === 'Recipe') {
          if (
            linkData.recipeYield &&
            Array.isArray(linkData.recipeYield) &&
            linkData.recipeYield.length
          ) {
            linkData.recipeYield = linkData.recipeYield[0];
          }
          if (
            linkData.recipeCuisine &&
            Array.isArray(linkData.recipeCuisine) &&
            linkData.recipeCuisine.length
          ) {
            linkData.recipeCuisine = linkData.recipeCuisine[0];
          }

          if (!linkData.datePublished) {
            linkData.datePublished = new Date();
          }

          if (url.startsWith('https://www.connoisseurusveg.com/')) {
            const image = {
              '@type': 'ImageObject',
              height: $('meta[property="og:image:width"]').attr('content'),
              url: $('meta[property="og:image"]').attr('content'),
              width: $('meta[property="og:image:height"]').attr('content'),
            };
            linkData.image = image;
          }
        }
        if (type === 'Product') {
          if (url.includes('woolworths')) {
            const price = $('.price').text();
            const nutritionScraped: Record<string, string> = {};
            $('.nutrition-row').each(function (_: number, rowElement: any) {
              const key = slugify(
                $($('.nutrition-column', rowElement).get(0)).text(),
                { lower: true, strict: true, replacement: '_' },
              );
              const value = $($('.nutrition-column', rowElement).get(1))
                .text()
                .trim();
              nutritionScraped[key] = value;
            });
            const nutritionKeyRenameMap = {
              energy: 'calories',
              protein: 'proteinContent',
              fat_total: 'fatContent',
              saturated: 'saturatedFatContent',
              carbohydrate: 'carbohydrateContent',
              sugars: 'sugarContent',
              sodium: 'sodiumContent',
            };
            const nutrition = renameKeys(
              nutritionKeyRenameMap,
              nutritionScraped,
            );
            linkData.additionalProperty = linkData.additionalProperty
              ? linkData.additionalProperty
              : [];
            if (nutrition && Object.keys(nutrition).length) {
              linkData.additionalProperty.push({
                ...nutrition,
                '@type': 'NutritionInformation',
                name: 'nutrition',
                servingSize: '100 g',
              });
            }
            if (!linkData.offers) {
              linkData.offers = { price };
            } else if (!linkData.offers.price) {
              linkData.offers.price = price;
            }
          }
        }
        if (linkData.offers && !Array.isArray(linkData.offers)) {
          const woolworths = {
            availabilityStarts: new Date(),
            offeredBy: 'Woolworths',
            seller: {
              '@type': 'Organization',
              name: 'Woolworths',
            },
          };
          const coles = {
            availabilityStarts: new Date(),
            offeredBy: 'Coles',
            seller: {
              '@type': 'Organization',
              name: 'Coles',
            },
          };
          if (url.includes('woolworths')) {
            linkData.offers = {
              offers: [
                {
                  '@type': 'Offer',
                  '@context': 'http://schema.org',
                  url,
                  ...linkData.offers,
                  ...woolworths,
                },
              ],
            };
          } else if (url.includes('coles')) {
            linkData.offers = {
              offers: [
                {
                  '@type': 'Offer',
                  '@context': 'http://schema.org',
                  url,
                  ...linkData.offers,
                  ...coles,
                },
              ],
            };
          } else {
            linkData.offers = undefined;
          }
        }

        const organizations = _.filter(
          linkData,
          (i: any) => i && i['@type'] === 'Organization',
        );

        if (linkData.brand && typeof linkData.brand !== 'object') {
          organizations.push({
            name: linkData.brand,
          });
        }

        if (organizations) {
          organizations.map((organization: Organization) => {
            const { name } = organization;
            if (name) {
              const folder = `content/organizations/`;
              fs.mkdirSync(folder, { recursive: true });
              fs.writeFileSync(
                `${folder}/${slugify(name, {
                  lower: true,
                  strict: true,
                })}.json`,
                JSON.stringify(
                  sortobject({
                    ...organization,
                    name: name.split(' ').map(_.capitalize).join(' '),
                    '@type': 'Organization',
                    '@id': undefined,
                    '@context': undefined,
                  }),
                  undefined,
                  2,
                ) + '\n',
              );
            }
          });
        }

        const data = sortobject({
          ...linkData,
          sameAs,
          mainEntityOfPage: undefined,
          isPartOf: undefined,
          // offers: undefined,
          '@type': type,
          '@id': undefined,
          '@context': undefined,
          updatedAt: new Date(),
        });
        return data;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export default scrape;
