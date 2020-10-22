const { readFile, writeFile, mkdir } = require('fs').promises;
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import slugify from 'slugify';
import merge from 'deepmerge';
import yargs from 'yargs';
import pluralize from 'pluralize';
import { Duration, DateTime } from 'luxon';
import scrape from './scrape';
import deepSort from './utils/deepSort';
import getFiles from './utils/getFiles';
import Thing from './models/Thing';
import formatString from './utils/formatString';
import Offer from './models/Offer';
import Product from './models/Product';
import Recipe from './models/Recipe';
import parseInstructions from './utils/parseInstructions';
import formatIngredient from './utils/formatIngredient';
import fromatInstructions from './utils/fromatInstructions';
import parseDuration from './utils/parseDuration';
import Organization from './models/Organization';

const argv = yargs
  .command('scrape', 'Crawl urls with browser', {})
  .option('scrape', {
    alias: 's',
    description: 'Crawl urls with browser',
    type: 'boolean',
    default: true,
  })
  .option('only-new', {
    alias: 'n',
    description: 'Only use default urls',
    type: 'boolean',
    default: false,
  })
  .option('collection', {
    alias: 'c',
    description: 'Collection',
    type: 'string',
    default: '',
  })
  .help()
  .alias('help', 'h').argv;

/**
 * Handy regex for selecting hrefs
 * Regex: "(https:\/\/www.budgetbytes.com\/.[^"]+)"
 * example: <a href="https://www.budgetbytes.com/black-bean-avocado-enchiladas/"],>[
 */

const urls = [
  [
    'https://www.woolworths.com.au/shop/productdetails/200695/sanitarium-weet-bix-breakfast-cereal',
  ],
];

const urlBlacklist = [
  'https://www.reddit.com/r/4chan/comments/bk8hu5/anon_fools_an_nbc_roastie_with_his_salad_lasagna/',
];

const fileUrlMap: Map<string, string> = new Map();

/**
 * Main top level async/await
 */
(async () => {
  const folder = `content/${argv.collection}`;
  await mkdir(folder, { recursive: true });
  // get list of urls to crawl from content files
  for await (const filename of getFiles(folder)) {
    const file = await readFile(filename, { encoding: 'utf8' });
    const content = JSON.parse(file);
    if (
      !argv['only-new'] &&
      content.sameAs &&
      !content.sameAs.some((item: string) => urlBlacklist.includes(item)) &&
      (!argv.scrape ||
        !content.updatedAt ||
        DateTime.fromISO(content.updatedAt) <
          DateTime.local().minus({
            days: content['@type'] === 'Recipe' ? 30 : 1,
          }))
    ) {
      urls.push(content.sameAs);
      for (const url of content.sameAs) {
        fileUrlMap.set(url, filename);
      }
    }
  }

  const total = urls.length;

  // crawl urls
  for (const [index, chunk] of urls.entries()) {
    const chunkData = [];
    if (argv.scrape) {
      for (const url of chunk) {
        const currentIndex = `${index + 1}`.padStart(`${total}`.length, '0');
        console.log(`${currentIndex}/${total}`, url);
        const linkData = await scrape(url);
        if (linkData) {
          chunkData.push(linkData);
        }
      }
    }

    const headChunk = _.head(chunk);

    if (headChunk && fileUrlMap.get(headChunk)) {
      const file = JSON.parse(
        await readFile(fileUrlMap.get(headChunk), {
          encoding: 'utf8',
        }),
      );
      chunkData.push(file);
    }
    // make sure existing file is first so all other data gets merged onto it.
    _.reverse(chunkData);

    // normalize attribute names
    chunkData.forEach((item, index) => {
      chunkData[index] = {
        ...item,
        recipeIngredient: item.recipeIngredient || item.recipeIngredients,
        recipeIngredients: undefined,
        name: item.name || item.title,
        title: undefined,
        description: item.description || item.content,
        content: undefined,
        id: undefined,
        categories: undefined,
        image: item.image || item.featuredImage,
        featuredImage: undefined,
        publish: undefined,
        slug: undefined,
        // youtubeUrl: undefined,
        recipeInstructions: item.recipeInstructions || item.recipeSteps,
        recipeSteps: undefined,
        featuredRecipe: undefined,
        keywords:
          item.keywords ||
          (item.searchTags && Array.isArray(item.searchTags)
            ? _.uniq(_.map(item.searchTags, _.trim)).join(', ')
            : undefined),
        searchTags: undefined,
        recipeNotes: undefined,
        recipeIntros: undefined,
        review: undefined,
      };
    });

    const overwriteMerge = (
      destinationArray: Array<any>,
      sourceArray: Array<any>,
      options: any,
    ) => _.unionWith(destinationArray, sourceArray, _.isEqual);
    const mergeData = merge.all(chunkData, {
      arrayMerge: overwriteMerge,
    }) as Thing;
    const linkData =
      mergeData['@type'] === 'Recipe'
        ? new Recipe(mergeData)
        : new Product(mergeData);

    if (linkData.name && headChunk) {
      const filename = fileUrlMap.get(headChunk);
      linkData.name = formatString(linkData.name);
      const slug = path.basename(
        filename ||
          slugify(linkData.name, {
            lower: true,
            strict: true,
          }),
        '.json',
      );

      const collection = filename
        ? path.basename(path.dirname(filename))
        : _.upperFirst(linkData['@type']);

      const type =
        _.upperFirst(linkData['@type']) ||
        _.upperFirst(pluralize(collection, 1));
      linkData['@type'] = type;

      if (linkData.additionalProperty) {
        linkData.additionalProperty = _.uniqBy(
          linkData.additionalProperty,
          'name',
        );
      }

      if (linkData instanceof Recipe) {
        if (
          linkData.prepTime &&
          !Duration.fromISO(linkData.prepTime).toJSON()
        ) {
          linkData.prepTime = parseDuration(linkData.prepTime);
        }
        if (
          linkData.totalTime &&
          !Duration.fromISO(linkData.totalTime).toJSON()
        ) {
          linkData.totalTime = parseDuration(linkData.totalTime);
        }
        if (
          linkData.cookTime &&
          !Duration.fromISO(linkData.cookTime).toJSON()
        ) {
          linkData.cookTime = parseDuration(linkData.cookTime);
        }

        const recipeIngredientChunkData = _.find(
          chunkData,
          'recipeIngredient',
        ) as Recipe;
        if (
          recipeIngredientChunkData &&
          recipeIngredientChunkData.recipeIngredient
        ) {
          const recipeIngredient = recipeIngredientChunkData.recipeIngredient;
          const recipeIngredientArray =
            recipeIngredient &&
            recipeIngredient.length > 0 &&
            typeof recipeIngredient[0] === 'object' &&
            recipeIngredient[0].group &&
            recipeIngredient[0].group.ingredients
              ? recipeIngredient[0].group.ingredients
              : recipeIngredient;

          linkData.recipeIngredient = _.uniq(
            _.map(recipeIngredientArray.map(formatIngredient), _.trim),
          );
        }

        const recipeInstructionsChunkData = _.find(
          chunkData,
          'recipeInstructions',
        );
        if (
          recipeInstructionsChunkData &&
          recipeInstructionsChunkData.recipeInstructions
        ) {
          const recipeInstructions =
            recipeInstructionsChunkData.recipeInstructions;
          const recipeInstructionsArray = parseInstructions(recipeInstructions);
          if (recipeInstructionsArray) {
            linkData.recipeInstructions = _.uniq(
              fromatInstructions(recipeInstructionsArray),
            );
          }
        }

        if (linkData.author && linkData.author['@type'] === 'Person') {
          const slug = slugify(linkData.author.name, {
            lower: true,
            strict: true,
          });
          const personPath = `content/people/${slug}.json`;
          const oldPerson = fs.existsSync(personPath)
            ? JSON.parse(
                await readFile(personPath, {
                  encoding: 'utf8',
                }),
              )
            : {};
          const author = { ...oldPerson, ...linkData.author };
          const sameAs = _.uniq([
            ...(author.sameAs || []),
            ...(linkData.sameAs || []),
          ]);
          if (argv.scrape) {
            author.updatedAt = new Date();
          }
          await writeFile(
            personPath,
            JSON.stringify(
              deepSort({
                ...author,
                sameAs,
                '@type': 'Person',
                '@id': undefined,
                '@context': undefined,
              }),
              undefined,
              2,
            ) + '\n',
          );
        }

        // if (linkData.youtubeUrl) {
        //   const crawlUrl = linkData.youtubeUrl.replace('/embed/', '/watch/');
        //   const video = await scrape(crawlUrl);
        //   if (video) {
        //     linkData.video = video;
        //     linkData.youtubeUrl = undefined;
        //     if (!linkData.name) {
        //       linkData.name = formatString(video.name);
        //     }
        //     if (!linkData.description) {
        //       linkData.description = formatString(video.description);
        //     }
        //   }
        // }
      }

      const organizations: Organization[] = Object.values(
        _.pickBy(linkData, (i: any) => {
          return i && typeof i === 'object' && i['@type'] === 'Organization';
        }),
      );

      if (linkData instanceof Product) {
        // dedup and print offers to offers collection
        if (linkData.offers && linkData.offers.offers) {
          linkData.offers.offers = _.uniqBy(
            linkData.offers.offers,
            'offeredBy',
          );
          linkData.offers = {
            // priceCurrency: _.head(_.map(linkData.offers.offers, 'priceCurrency')),
            ...linkData.offers,
            '@type': 'AggregateOffer',
            highPrice: Math.max(..._.map(linkData.offers.offers, 'price')),
            lowPrice: Math.min(..._.map(linkData.offers.offers, 'price')),
            offerCount: linkData.offers.offers.length,
          };
          linkData.offers.offers.map(async (newOffer: Offer) => {
            const offerSlug = slugify(newOffer.offeredBy, {
              lower: true,
              strict: true,
            });
            const folder = `content/offers/${slug}`;
            const offerPath = `${folder}/${offerSlug}.json`;
            await mkdir(folder, { recursive: true });
            const oldOffer = fs.existsSync(offerPath)
              ? JSON.parse(
                  await readFile(offerPath, {
                    encoding: 'utf8',
                  }),
                )
              : {};
            const offer = {
              ...oldOffer,
              ...newOffer,
              '@type': 'Offer',
              '@id': undefined,
              '@context': undefined,
            };
            if (!offer.createdAt) {
              offer.createdAt = new Date();
            }
            if (argv.scrape || !offer.updatedAt) {
              offer.updatedAt = new Date();
            }
            await writeFile(
              offerPath,
              JSON.stringify(deepSort(offer), undefined, 2) + '\n',
            );
          });
        }

        if (linkData.brand && typeof linkData.brand !== 'object') {
          organizations.push(
            new Organization({
              '@type': 'Organization',
              name: linkData.brand,
            }),
          );
        }
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
                deepSort({
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

      // linkData.name = linkData.name || linkData.title;

      if (!linkData.createdAt) {
        linkData.createdAt = new Date();
      }

      const folder = `content/${pluralize(type).toLocaleLowerCase()}`;
      await mkdir(folder, { recursive: true });
      await writeFile(
        `${folder}/${slug}.json`,
        JSON.stringify(deepSort(linkData), undefined, 2) + '\n',
      );
    }
  }
})();
