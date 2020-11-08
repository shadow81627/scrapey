import { promises as fsPromises } from 'fs';
const { readFile } = fsPromises;
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import slugify from 'slugify';
import merge from 'deepmerge';
import pluralize from 'pluralize';
import { Duration } from 'luxon';
import Thing from '../models/Thing';
import formatString from '../utils/formatString';
import Offer from '../models/Offer';
import Product from '../models/Product';
import Recipe from '../models/Recipe';
import parseInstructions from '../utils/parseInstructions';
import formatIngredient from '../utils/formatIngredient';
import fromatInstructions from '../utils/fromatInstructions';
import parseDuration from '../utils/parseDuration';
import Organization from '../models/Organization';
import ContentService from '../content.service';
import ImageObject from '../models/ImageObject';
import probe from 'probe-image-size';

interface ProcessLinkDataParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkData: Array<any>;
  chunk: Array<string>;
  fileUrlMap: Map<string, string>;
  argv: Record<string, unknown>;
}

export async function processLinkData({
  chunkData,
  chunk,
  fileUrlMap,
  argv,
}: ProcessLinkDataParams): Promise<void> {
  const headChunk = _.head(chunk);

  if (headChunk && fileUrlMap.get(headChunk)) {
    const filename = fileUrlMap.get(headChunk);
    if (filename) {
      const file = JSON.parse(
        await readFile(filename, {
          encoding: 'utf8',
        }),
      );
      chunkData.push(file);
    }
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
    destinationArray: Array<Thing>,
    sourceArray: Array<Thing>,
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
      _.upperFirst(linkData['@type']) || _.upperFirst(pluralize(collection, 1));
    linkData['@type'] = type;

    if (linkData.additionalProperty) {
      linkData.additionalProperty = _.uniqBy(
        linkData.additionalProperty,
        'name',
      );
    }

    if (linkData.image) {
      const image =
        Array.isArray(linkData.image) && typeof linkData.image !== 'string'
          ? _.head(linkData.image)
          : linkData.image;
      const imageUrl =
        typeof image === 'object' && image.url ? image.url : image;
      if (typeof imageUrl === 'string') {
        try {
          const imageMeta = await probe(imageUrl);
          linkData.image = new ImageObject(imageMeta);
        } catch (_) { }
      }
    }

    if (linkData instanceof Recipe) {
      const durationProperties = new Map(
        Object.entries(
          _.pick(linkData, ['prepTime', 'totalTime', 'cookTime']),
        ).filter(Boolean),
      ) as Map<
        keyof Pick<Recipe, 'prepTime' | 'totalTime' | 'cookTime'>,
        string
      >;
      for (const [key, value] of durationProperties) {
        if (!Duration.fromISO(value).toJSON()) {
          linkData[key] = parseDuration(value);
        }
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
        const recipeIngredientArray = recipeIngredient || [];

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
        linkData.author.name = linkData.author.name.replace('Adapted from', '');
        linkData.author.name = linkData.author.name.replace(
          'adapted recipe from',
          '',
        );
        linkData.author.name = formatString(linkData.author.name);
        const personSlug = slugify(linkData.author.name, {
          lower: true,
          strict: true,
        });
        const folder = `content/people`;
        const personPath = `${folder}/${personSlug}.json`;
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
        const data = {
          ...author,
          sameAs,
          '@type': 'Person',
          '@id': undefined,
          '@context': undefined,
        };
        await ContentService.save({ data, slug: personSlug, folder });
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

    const organizations = Object.values(
      _.pickBy(linkData, (i: unknown) => {
        if (i && typeof i === 'object' && i.hasOwnProperty('@type')) {
          const org = i as Thing;
          return org['@type'] === 'Organization';
        }
      }),
    ) as Organization[];

    if (linkData instanceof Product) {
      // dedup and print offers to offers collection
      if (linkData.offers && linkData.offers.offers) {
        linkData.offers.offers = _.uniqBy(linkData.offers.offers, 'offeredBy');
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
          const oldOffer =
            (await ContentService.load({ folder, slug: offerSlug })) ?? {};
          const offer = new Offer({
            ...oldOffer,
            ...newOffer,
            name: `${newOffer.offeredBy} ${linkData.name}`,
            '@type': 'Offer',
            '@id': undefined,
            '@context': undefined,
          });
          if (argv.scrape || !offer.updatedAt) {
            offer.updatedAt = new Date();
          }
          await ContentService.save({ data: offer, slug: offerSlug, folder });
        });
      }

      if (linkData.brand && typeof linkData.brand !== 'object') {
        organizations.push({
          '@type': 'Organization',
          name: linkData.brand,
        });
      }
    }

    if (organizations) {
      _.flatMap(
        _.partition(organizations, 'name'),
        (orgs) =>
          merge.all(orgs, { arrayMerge: overwriteMerge }) as Organization,
      )
        .filter(({ name }) => name)
        .map(async (organization: Organization) => {
          const { name } = organization;
          const orgSlug = `${slugify(name, {
            lower: true,
            strict: true,
          })}`;
          const folder = `content/organizations/`;
          const oldData =
            (await ContentService.load({ folder, slug: orgSlug })) ?? {};
          const data = new Organization({
            ...oldData,
            ...organization,
            name: name.split(' ').map(_.capitalize).join(' '),
            '@type': 'Organization',
            '@id': undefined,
            '@context': undefined,
          });
          if (argv.scrape || !data.updatedAt) {
            data.updatedAt = new Date();
          }
          await ContentService.save({
            data,
            slug: orgSlug,
            folder,
          });
        });
    }

    // linkData.name = linkData.name || linkData.title;

    if (!linkData.createdAt) {
      linkData.createdAt = new Date();
    }

    const folder = `content/${pluralize(type).toLocaleLowerCase()}`;
    await ContentService.save({ data: linkData, slug, folder });
  }
}
