import { Thing } from '../entity/Thing';

type ThingParmas = Pick<
  Thing,
  'name' | 'type' | 'description' | 'urls' | 'dated' | 'additionalProperty'
  >;

export default ThingParmas;