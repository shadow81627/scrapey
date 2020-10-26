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
                    const product = (await connection.manager.findOne(Product, { where: [{ gtin13 }] })) ?? new Product();
                    product.gtin13 = gtin13;
                    product.thing = thing

                    if (typeof brand === "string") {
                        // const slug = `${slugify(brand, {
                        //     lower: true,
                        //     strict: true,
                        // })}`
                        const org = (await connection.manager.findOne(Organization, { thing })) ?? new Organization();
                        // org.name = brand.split(' ').map(_.capitalize).join(' ');
                        // org.slug = slug;
                        await connection.manager.save(org);
                        product.brand = org
                    }
                    await connection.manager.save(product);
                }
            }
        }
        // if (type === 'Organization') {
        //     const slug = `${slugify(name, {
        //         lower: true,
        //         strict: true,
        //     })}`
        //     const org = (await connection.manager.findOne(Organization, { slug })) ?? new Organization();
        //     org.name = name.split(' ').map(_.capitalize).join(' ');
        //     org.slug = slug;
        //     await connection.manager.save(org);
        // }
    }

}).catch(error => console.log(error));
