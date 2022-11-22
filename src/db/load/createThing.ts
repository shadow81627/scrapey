import 'reflect-metadata';
import { getConnection } from 'typeorm';
import slugify from 'slugify';
import _ from 'lodash';
import { Thing } from '../entity/Thing';
import ThingParmas from './ThingParams';

export default async function createThing({
  name,
  type,
  description,
  urls,
  dated,
  additionalProperty,
}: ThingParmas): Promise<Thing> {
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