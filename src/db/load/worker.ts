import 'reflect-metadata';
import { Url } from '../entity';
import { Product } from '../entity';
import _ from 'lodash';
import { Image } from '../entity';
import { Recipe } from '../entity';
import { NutritionInformation } from '../entity/NutritionInformation';
import { ThingType } from '../util/ThingType';
import { Offer } from '../entity';
import { promises as fsPromises } from 'fs';
import createThing from '../load/createThing';
import createOrganization from '../load/createOrganization';
import createPerson from '../load/createPerson';
const { readFile } = fsPromises;
const schemaDomainRegex = /https?:\/\/schema.org\//g;
import { expose } from 'threads/worker';
import AppDataSource from '../data-source';
import probeImage from '../../utils/probeImage';

async function loadDB(filename: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const connection = AppDataSource;

  const file = await readFile(filename, { encoding: 'utf8' });
  const {
    name,
    description,
    sameAs = [],
    '@type': type,
    createdAt,
    updatedAt,
    author,
    keywords,
    additionalProperty,
    ...content
  } = JSON.parse(file);
  const dated = {
    createdAt,
    updatedAt,
  };
  const urls = [];
  try {
    for (const location of sameAs) {
      const url = new Url(Url.urlToParts(location));
      urls.push(url);
      await connection.manager.save(url);
    }
    if (name) {
      const thing = await createThing({
        name,
        description,
        type,
        urls,
        dated,
        additionalProperty,
      });

      if (content.image) {
        const imageObject =
          Array.isArray(content.image) && typeof content.image !== 'string'
            ? _.head(content.image)
            : content.image;
        const imageUrl =
          typeof imageObject === 'object' && imageObject.url
            ? imageObject.url
            : imageObject;
        const url = new Url(Url.urlToParts(imageUrl));
        await connection.manager.save(url);
        if (typeof imageUrl === 'string') {
          const image =
            (await connection.manager.findOne(Image, {
              where: [{ url: { id: url.id } }],
              relations: { url: true },
            })) ?? connection.manager.create(Image, { url });
          // if (typeof imageObject === "object") {
              // // TODO: remove url string from imageObject before merge
              //     connection.manager.merge(Image, image, imageObject);
              // }
          if (!url.crawledAt && false) {
            await probeImage(image);
          }
          await connection.manager.save(image);
          thing.images?.push(image);
          await connection.manager.save(thing);
        }
      }

      if (type === 'Product') {
        const { gtin13, brand } = content;
        if (gtin13 || brand) {
          const product =
            (await connection.manager.findOne(Product, {
              where: [{ gtin13 }, { thing: { id: thing.id } }],
            })) ??
            connection.manager.create(Product, {
              dated,
            });
          product.gtin13 = gtin13;
          product.thing = thing;

          if (brand && (typeof brand === 'string' || brand.name)) {
            const org = await createOrganization({
              name: (brand.name ?? brand)
                .split(' ')
                .map(_.capitalize)
                .join(' '),
              type: 'Organization' as ThingType,
              urls,
              dated,
            });
            product.brand = org;
          }

          await connection.manager.save(product);

          if (content.offers && content.offers.offers) {
            for (const offerData of content.offers.offers) {
              const url = new Url(Url.urlToParts(offerData.url));
              await connection.manager.save(url);
              const seller = await createOrganization(offerData.seller);
              const offer =
                (await connection.manager.findOne(Offer, {
                  where: [
                    {
                      itemOffered: { id: product.id },
                      seller: { id: seller.id },
                    },
                    { url: { id: url.id } },
                  ],
                  relations: { itemOffered: true, seller: true },
                })) ??
                connection.manager.create(Offer, {
                  ...offerData,
                  itemOffered: product,
                  seller,
                  url,
                  dated: {
                    createdAt: offerData.createdAt,
                    updatedAt: offerData.updatedAt,
                  },
                });
              connection.manager.merge(Offer, offer, {
                availability: offerData.availability?.replace(
                  schemaDomainRegex,
                  '',
                ),
                itemCondition: offerData.itemCondition?.replace(
                  schemaDomainRegex,
                  '',
                ),
                price: offerData.price,
              });
              connection.manager.save(offer);
            }
          }
          // await product.toFile();
        }
      }

      if (type === 'Person') {
        await createPerson(thing);
      }

      if (type === 'Recipe') {
        if (content.nutrition) {
          const nutrition =
            (await connection.manager.findOne(NutritionInformation, {
              where: [{ thing: { slug: thing.slug } }],
            })) ??
            connection.manager.create(NutritionInformation, {
              thing,
              dated,
            });
          connection.manager.merge(
            NutritionInformation,
            nutrition,
            content.nutrition,
          );
          await connection.manager.save(nutrition);
        }
        const recipe =
          (await connection.manager.findOne(Recipe, {
            where: [{ thing: { slug: thing.slug } }],
          })) ??
          connection.manager.create(Recipe, {
            thing,
            dated,
          });
        const { recipeYield, recipeCuisine } = content;
        connection.manager.merge(Recipe, recipe, {
          ...content,
          thing,
          suitableForDiet: content.suitableForDiet
            ? String(content.suitableForDiet)?.replace(schemaDomainRegex, '')
            : null,
          recipeCuisine:
            typeof recipeCuisine === 'string' ? recipeCuisine : null,
          recipeYield: _.trim(
            recipeYield?.replace('servings', '').replace('Serves', ''),
          ),
        });
        if (author) {
          if (author['@type']) {
            if (author['@type'] === 'Person') {
              const person = await createPerson(author);
              recipe.author = person.thing;
            }
            if (author['@type'] === 'Organization') {
              const org = await createOrganization(author);
              recipe.author = org.thing;
            }
          }
          // TODO: create a plain old thing because we don't know if the autor is an org or person
          // if (typeof author === "string") {}
        }
        if (keywords && typeof keywords === 'string') {
          recipe.keywords = _.uniq(
            (recipe.keywords ?? [])
              .concat(keywords.split(','))
              .map((word: string) => _.trim(word.toLowerCase())),
          );
        }
        await connection.manager.save(recipe);
      }
    }
    if (type === 'Organization') {
      await createOrganization({
        name: name.split(' ').map(_.capitalize).join(' '),
        type: 'Organization' as ThingType,
        urls,
        dated,
      });
    }
  } catch (e) {
    console.error(filename, e);
  }
}

export type LoadDB = typeof loadDB;

expose(loadDB);
