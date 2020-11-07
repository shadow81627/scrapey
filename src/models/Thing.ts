import formatString from '../utils/formatString';
import ImageObject from './ImageObject';

export default class Thing {
  '@id'?= undefined;
  '@context'?= undefined;
  '@type' = 'Thing';
  name: string;
  description?: string;
  image?: ImageObject | string | Array<string | ImageObject>;
  additionalProperty?: Array<{ name: string, value: string }>;
  sameAs?: Array<string>;
  createdAt?: Date = new Date();
  updatedAt?: Date = new Date();

  constructor({ name, ...data }: Thing) {
    Object.assign(this, data);
    this.name = formatString(name);
  }
}
