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
import ImageObject from "../models/ImageObject";
const { readFile } = fsPromises;

createConnection().then(async connection => {

    // get list of urls to crawl from content files
    for await (const filename of getFiles('content')) {
        const file = await readFile(filename, { encoding: 'utf8' });
        const { name, description, sameAs = [], '@type': type, ...content } = JSON.parse(file);

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
                try {
                    const imageMeta = await ImageObject.fetchMeta(imageUrl);
                    url.crawledAt = new Date();
                    const image = (await connection.manager.findOne(Image, { where: [{ url }] })) ?? connection.manager.create(Image, { ...imageMeta, url });
                    // if (typeof imageObject === "object") {
                    // // TODO: remove url string from imageObject before merge
                    //     connection.manager.merge(Image, image, imageObject);
                    // }
                    await connection.manager.save(image);
                    await connection.manager.save(url);
                } catch (e) {
                    console.error(e);
                    const image = (await connection.manager.findOne(Image, { where: [{ url }] })) ?? connection.manager.create(Image, { url });
                    await connection.manager.save(image);
                }
            }
        }

        if (name) {
            const slug = `${slugify(name, {
                lower: true,
                strict: true,
            })}`;
            const thing = (await connection.manager.findOne(Thing, { where: [{ slug }] })) ?? new Thing();
            thing.type = type;
            thing.slug = slug;
            thing.name = name.split(' ').map(_.capitalize).join(' ');
            thing.description = description;
            thing.urls = urls;
            await connection.manager.save(thing);

            if (type === 'Product') {
                const { gtin13, brand } = content;
                if (gtin13 || brand) {
                    const product = (await connection.manager.findOne(Product, { where: [{ gtin13 }, { thing }] })) ?? new Product();
                    product.gtin13 = gtin13;
                    product.thing = thing

                    if (typeof brand === "string") {
                        const slug = `${slugify(brand, {
                            lower: true,
                            strict: true,
                        })}`
                        const orgThing = (await connection.manager.findOne(Thing, { slug })) ?? new Thing();
                        const org = (await connection.manager.findOne(Organization, { where: [{ thing: orgThing }] })) ?? new Organization();
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
        }
        if (type === 'Organization') {
            const slug = `${slugify(name, {
                lower: true,
                strict: true,
            })}`
            const orgThing = (await connection.manager.findOne(Thing, { slug })) ?? new Thing();
            const org = (await connection.manager.findOne(Organization, { where: [{ thing: orgThing }] })) ?? new Organization();
            orgThing.name = name.split(' ').map(_.capitalize).join(' ');
            orgThing.slug = slug;
            org.thing = orgThing;
            await connection.manager.save(orgThing);
            await connection.manager.save(org);
        }
    }

}).catch(error => console.log(error));
