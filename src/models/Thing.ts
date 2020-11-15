import formatString from '../utils/formatString';
import ImageObject from './ImageObject';

export default class Thing {
  '@id'?= undefined;
  '@context'?= undefined;
  '@type' = 'Thing';
  name: string;
  description?: string = undefined;
  image?: ImageObject | string | Array<string | ImageObject> = undefined;
  additionalProperty?: Array<{ name: string, value: string }> = undefined;
  sameAs?: Array<string> = undefined;
  createdAt?: Date = new Date();
  updatedAt?: Date = new Date();

  constructor({ name, ...data }: Thing) {
    Object.assign(this, data);
    this.name = formatString(name);
  }
}
