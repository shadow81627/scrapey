import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';
import { Url } from './entity/Url';
import getFiles from '../utils/getFiles';
import { Product } from './entity/Product';
import { Organization } from './entity/Organization';
import slugify from 'slugify';
import _ from 'lodash';
import { Thing } from './entity/Thing';
import { Image } from './entity/Image';
import { Person } from './entity/Person';
import probe from 'probe-image-size';
import { Recipe } from './entity/Recipe';
import { NutritionInformation } from './entity/NutritionInformation';
import { ThingType } from './util/ThingType';
import { Offer } from './entity/Offer';
import { promises as fsPromises } from 'fs';
const { readFile } = fsPromises;

const schemaDomainRegex = /https?:\/\/schema.org\//g;

type ThingParmas = Pick<
  Thing,
  'name' | 'type' | 'description' | 'urls' | 'dated' | 'additionalProperty'
>;

async function createThing({
  name,
  type,
  description,
  urls,
  dated,
  additionalProperty,
}: ThingParmas) {
  const connection = getConnection();
  const slug = `${slugify(name, {
    lower: true,
    strict: true,
  })}`;
  const thing =
    (await connection.manager.findOne(Thing, {
      where: [{ slug }],
      relations: ['images', 'urls'],
    })) ?? connection.manager.create(Thing, { dated });
  connection.manager.merge(Thing, thing, {
    type,
    slug,
    name: name.split(' ').map(_.capitalize).join(' '),
    description,
    additionalProperty,
  });
  if (urls) {
    thing.urls = (thing.urls ?? []).concat(urls);
  }
  await connection.manager.save(thing);
  return thing;
}
async function createPerson(params: ThingParmas) {
  const connection = getConnection();
  const thing = await createThing(params);
  const { dated } = params;
  const person =
    (await connection.manager.findOne(Person, {
      where: [{ thing }],
      relations: ['thing'],
    })) ??
    connection.manager.create(Person, {
      thing,
      dated,
    });
  await connection.manager.save(person);
  return person;
}
async function createOrganization(params: ThingParmas) {
  const connection = getConnection();
  const thing = await createThing(params);
  const { dated } = thing;
  const org =
    (await connection.manager.findOne(Organization, {
      where: [{ thing }],
      relations: ['thing'],
    })) ??
    connection.manager.create(Organization, {
      dated,
      thing,
    });
  await connection.manager.save(org);
  return org;
}

/**
 * Main top level async/await
 */
(async () => {
  const connection = await createConnection();
  // get list of urls to crawl from content files
  for await (const filename of getFiles('content')) {
    console.log(filename);
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
                where: [{ url }],
                relations: ['url'],
              })) ?? connection.manager.create(Image, { url });
            if (!url.crawledAt) {
              try {
                const { width, height, mime } = await probe(imageUrl);
                connection.manager.merge(Image, image, { width, height, mime });
                // if (typeof imageObject === "object") {
                // // TODO: remove url string from imageObject before merge
                //     connection.manager.merge(Image, image, imageObject);
                // }
                await connection.manager.save(image);
              } catch (e) {
                console.error(e);
              } finally {
                url.crawledAt = new Date();
                await connection.manager.save(url);
              }
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
                where: [{ gtin13 }, { thing }],
              })) ??
              connection.manager.create(Product, {
                dated,
              });
            product.gtin13 = gtin13;
            product.thing = thing;

            if (brand) {
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
                    where: [{ itemOffered: product, seller }, { url }],
                    relations: ['itemOffered', 'seller'],
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
                where: [{ thing }],
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
              where: [{ thing }],
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
                .map((word) => _.trim(word.toLowerCase())),
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
      console.log(filename, e);
    }
  }
  await connection.close();
})();
