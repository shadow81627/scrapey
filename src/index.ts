const { readFile, writeFile, mkdir } = require('fs').promises;
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import slugify from 'slugify';
import merge from 'deepmerge';
import he from 'he';
import yargs from 'yargs';
import pluralize from 'pluralize';
import { Duration, DateTime } from 'luxon';
import { normalizeWhiteSpaces } from 'normalize-text';
import scrape from './scrape';
import deepSort from './utils/deepSort';
import pipe from './utils/pipe';

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
  // ['https://www.connoisseurusveg.com/vegan-ribs/']
  // ['https://shop.coles.com.au/a/sunnybank-hills/product/pukka-tea-detox'],
  // ['https://bakeplaysmile.com/best-banana-bread/'],
  [
    'https://shop.coles.com.au/a/sunnybank-hills/product/coles-natures-kitchen-lentil-spag-bolognese',
  ],
];

const urlBlacklist = [
  'https://www.reddit.com/r/4chan/comments/bk8hu5/anon_fools_an_nbc_roastie_with_his_salad_lasagna/',
];

const fileUrlMap: Map<string, string> = new Map();

class HowToStep {
  '@type' = 'HowToStep';
  text = '';
  image?: string;
  stepImageUrl?: string;

  constructor(data: Partial<HowToStep>) {
    Object.assign(this, data);
  }
}

class HowToSection {
  '@type' = 'HowToSection';
  name?: string;
  position?: string | number;
  itemListElement?: Array<HowToStep>;

  constructor(data: Partial<HowToSection>) {
    Object.assign(this, data);
  }
}

class Person {
  '@type' = 'Person';
  name: string;

  constructor({ name, ...data }: Person) {
    Object.assign(this, data);
    this.name = name;
  }
}

class Thing {
  '@type'? = 'Thing';
  name: string;
  additionalProperty?: Array<any>;
  sameAs?: Array<string>;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  constructor({ name, ...data }: Thing) {
    this.name = formatString(name);
    Object.assign(this, data);
  }
}

interface Offer {
  offeredBy: string;
}

interface Offers {
  '@type': 'AggregateOffer';
  priceCurrency: string;
  highPrice?: number;
  lowPrice?: number;
  offerCount?: number;
  offers: Array<Offer>;
}

class Product extends Thing {
  '@type'? = 'Product';
  offers?: Offers;

  constructor(data: Product) {
    super(data);
    Object.assign(this, data);
  }
}

class Recipe extends Thing {
  '@type'? = 'Recipe';
  prepTime?: string;
  totalTime?: string;
  cookTime?: string;
  recipeIngredient?: Array<any>;
  recipeInstructions?: Array<string | HowToSection | HowToStep> = [];
  author?: Person;
  video?: {};

  constructor({ recipeInstructions = [], ...data }: Recipe) {
    super(data);
    this.recipeInstructions = parseInstructions(recipeInstructions);
  }
}

function parseInstructions(
  instructions: string | Array<string | HowToSection | HowToStep>,
): Array<HowToStep> {
  if (typeof instructions === 'string') {
    return (
      formatString(instructions)
        .match(/[^.!?]+[.!?]+[^)]/g)
        ?.map((text) => new HowToStep({ text })) || []
    );
  }
  if (Array.isArray(instructions)) {
    const head = _.head(instructions) as HowToSection;
    if (head && head.itemListElement) {
      return head.itemListElement as Array<HowToStep>;
    } else {
      return instructions as Array<HowToStep>;
    }
  }
  return instructions;
}

function formatString(value: string) {
  const removeDuplicateSpaces = (str: string) => str.replace(/\s+/g, ' ');
  const removeHtml = (str: string) => str.replace(/(<([^>]+)>)/gi, '');
  const replaceFractionSlash = (str: string) =>
    str
      .normalize('NFKD')
      .replace(/(\d)⁄(\d+)/g, ' $1/$2 ')
      .normalize();
  const removeDuplicateParenthesis = (str: string) =>
    str.replace(/([()])(?=[()])/g, '');
  const removeDuplicatePunctuation = (str: string) =>
    str.replace(/([.!?,;])(?=[.!?,;])/g, '');
  const removeSpaceBeforePunctuation = (str: string) =>
    str.replace(/\s+([.!?,;])/g, '$1');

  return pipe(
    String,
    he.decode,
    removeHtml,
    replaceFractionSlash,
    // normalizeDiacritics,
    normalizeWhiteSpaces,
    removeDuplicateSpaces,
    removeDuplicateParenthesis,
    removeSpaceBeforePunctuation,
    removeDuplicatePunctuation,
    // punctuation,
    _.trim,
  )(value);
}

function formatIngredient(
  ingredient: { quantity: string | number; ingredient: string } | string,
) {
  // turn objects into strings
  if (
    typeof ingredient === 'object' &&
    ingredient.quantity &&
    ingredient.ingredient
  ) {
    return formatString(
      `${
        ingredient.quantity && ingredient.quantity !== 'N/A'
          ? ingredient.quantity
          : ''
      } ${ingredient.ingredient}`,
    );
  } else {
    return formatString(String(ingredient));
  }
}

function fromatInstructions(
  instructions: Array<HowToStep | string | HowToSection>,
) {
  return (
    instructions
      // ensure instruction.text is a string
      .map(
        (instruction) =>
          new HowToStep(
            !instruction || typeof instruction === 'string'
              ? { text: instruction || '' }
              : instruction,
          ),
      )
      // add type
      .map((instruction) => ({ ...instruction, '@type': 'HowToStep' }))
      .map((instruction) => ({
        ...instruction,
        text: formatString(instruction.text),
      }))
      // rename stepImageUrl
      // TODO: check iamge is public
      .map((instruction) => ({
        ...instruction,
        image: instruction.image || instruction.stepImageUrl,
        stepImageUrl: undefined,
        url: undefined,
        name: undefined,
      }))
      // remove empty
      .filter(({ text }) => Boolean(text))
      // ensure ends with punctuation
      .map((instruction) => ({
        ...instruction,
        text: instruction.text,
        // .replace(/([^.!?])$/, '$1.')
        // remove whitespace before punctuation / non-word characters
        // .replace(/\s+(\W)/g, '$1'),
      }))
  );
}

function parseDuration(duration: string) {
  return `PT${((duration || '').match(/(\d+)/g) || [''])[0]}${
    (duration || '').search('mins') ? 'M' : 'H'
  }`;
}

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
        const linkData: Thing = await scrape(url);
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
