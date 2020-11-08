import "reflect-metadata";
import { createConnection } from "typeorm";
import { Url } from "./entity/Url";
import getFiles from "../utils/getFiles";
import { promises as fsPromises } from 'fs';
import normalizeUrl from 'normalize-url'
import { Product } from "./entity/Product";
import { Organization } from "./entity/Organization";
import slugify from "slugify";
import _ from "lodash";
import { Thing } from "./entity/Thing";
import { Image } from "./entity/Image";
import { Person } from "./entity/Person";
const { readFile } = fsPromises;
import probe from 'probe-image-size';
import { Recipe } from "./entity/Recipe";

createConnection().then(async connection => {

    // get list of urls to crawl from content files
    for await (const filename of getFiles('content')) {
        const file = await readFile(filename, { encoding: 'utf8' });
        const { name, description, sameAs = [], '@type': type, createdAt, updatedAt, ...content } = JSON.parse(file);

        const urls = [];

        for (const location of sameAs) {
            const { hostname, pathname, search } = new URL(normalizeUrl(location));
            const url = new Url({ hostname, pathname, search });
            urls.push(url)
            await connection.manager.save(url);
        }

        if (content.image) {
            const imageObject = Array.isArray(content.image) && typeof content.image !== "string" ? _.head(content.image) : content.image;
            const imageUrl = typeof imageObject === "object" && imageObject.url ? imageObject.url : imageObject;
            const { hostname, pathname, search } = new URL(normalizeUrl(imageUrl));
            const url = new Url({ hostname, pathname, search });
            await connection.manager.save(url);
            if (typeof imageUrl === 'string') {
                const image = (await connection.manager.findOne(Image, { where: [{ url }] })) ?? connection.manager.create(Image, { url });
                if (!url.crawledAt) {
                    try {
                        const { width, height, mime } = await probe(imageUrl);
                        connection.manager.merge(Image, image, { width, height, mime });
                        url.crawledAt = new Date();
                        // if (typeof imageObject === "object") {
                        // // TODO: remove url string from imageObject before merge
                        //     connection.manager.merge(Image, image, imageObject);
                        // }
                        await connection.manager.save(image);
                        await connection.manager.save(url);
                    } catch (e) {
                        console.error(e);
                    }
                }
                await connection.manager.save(image);
            }
        }

        if (name) {
            const slug = `${slugify(name, {
                lower: true,
                strict: true,
            })}`;
            const thing = (await connection.manager.findOne(Thing, { where: [{ slug }] })) ?? connection.manager.create(Thing, { dated: { createdAt, updatedAt } });
            connection.manager.merge(Thing, thing, { type, slug, name: name.split(' ').map(_.capitalize).join(' '), description, urls, });
            await connection.manager.save(thing);

            if (type === 'Product') {
                const { gtin13, brand } = content;
                if (gtin13 || brand) {
                    const product = (await connection.manager.findOne(Product, { where: [{ gtin13 }, { thing }] })) ?? connection.manager.create(Product, { dated: { createdAt, updatedAt } });
                    product.gtin13 = gtin13;
                    product.thing = thing

                    if (typeof brand === "string") {
                        const slug = `${slugify(brand, {
                            lower: true,
                            strict: true,
                        })}`
                        const orgThing = (await connection.manager.findOne(Thing, { slug })) ?? connection.manager.create(Thing, { dated: { createdAt, updatedAt } });
                        const org = (await connection.manager.findOne(Organization, { where: [{ thing: orgThing }] })) ?? connection.manager.create(Organization, { dated: { createdAt, updatedAt } });
                        orgThing.name = brand.split(' ').map(_.capitalize).join(' ');
                        orgThing.slug = slug;
                        org.thing = orgThing;
                        await connection.manager.save(orgThing);
                        await connection.manager.save(org);
                        product.brand = org
                    }
                    await connection.manager.save(product);
                }
            }

            if (type === 'Person') {
                const person = (await connection.manager.findOne(Person, { where: [{ thing }] })) ?? connection.manager.create(Person, { thing, dated: { createdAt, updatedAt } });
                await connection.manager.save(person);
            }

            if (type === 'Recipe') {
                const recipe = (await connection.manager.findOne(Recipe, { where: [{ thing }] })) ?? connection.manager.create(Recipe, { thing, dated: { createdAt, updatedAt } });
                const { recipeYield, recipeCuisine } = content;
                connection.manager.merge(Recipe, recipe, { ...content, thing, recipeCuisine: typeof recipeCuisine === "string" ? recipeCuisine : null, recipeYield: _.trim(recipeYield?.replace('servings', '').replace('Serves', '')) });
                await connection.manager.save(recipe);
            }
        }
        if (type === 'Organization') {
            const slug = `${slugify(name, {
                lower: true,
                strict: true,
            })}`
            const orgThing = (await connection.manager.findOne(Thing, { slug })) ?? connection.manager.create(Thing, { dated: { createdAt, updatedAt } });
            const org = (await connection.manager.findOne(Organization, { where: [{ thing: orgThing }] })) ?? connection.manager.create(Organization, { dated: { createdAt, updatedAt } });
            orgThing.name = name.split(' ').map(_.capitalize).join(' ');
            orgThing.slug = slug;
            org.thing = orgThing;
            await connection.manager.save(orgThing);
            await connection.manager.save(org);
        }
    }

}).catch(error => console.log(error));
