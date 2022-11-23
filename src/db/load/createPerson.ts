import 'reflect-metadata';
import getOrCreateConnection from '../../utils/getOrCreateConnection';
import { Person } from '../entity';
import createThing from './createThing';
import ThingParmas from './ThingParams';

export default async function createPerson(
  params: ThingParmas,
): Promise<Person> {
  const connection = await getOrCreateConnection();
  const thing = await createThing(params);
  const { dated } = params;
  const person =
    (await connection.manager.findOne(Person, {
      where: [{ thing: { id: thing.id } }],
      relations: { thing: true },
    })) ??
    connection.manager.create(Person, {
      thing,
      dated,
    });
  await connection.manager.save(person);
  return person;
}
