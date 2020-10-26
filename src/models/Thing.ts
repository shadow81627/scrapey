import formatString from '../utils/formatString';

export default class Thing {
  '@id'?= undefined;
  '@context'?= undefined;
  '@type' = 'Thing';
  name: string;
  additionalProperty?: Array<{ name: string, value: string }>;
  sameAs?: Array<string>;
  createdAt?: Date = new Date();
  updatedAt?: Date = new Date();

  constructor({ name, ...data }: Thing) {
    Object.assign(this, data);
    this.name = formatString(name);
  }
}
