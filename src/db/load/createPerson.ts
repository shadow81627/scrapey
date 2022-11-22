import 'reflect-metadata';
import { getConnection } from 'typeorm';
import { Person } from '../entity/Person';
import createThing from './createThing';
import ThingParmas from './ThingParams';

export default async function createPerson(params: ThingParmas): Promise<Person> {
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