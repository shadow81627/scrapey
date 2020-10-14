import formatString from '../utils/formatString';

export default class Thing {
  '@type'? = 'Thing';
  name: string;
  additionalProperty?: Array<any>;
  sameAs?: Array<string>;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  constructor({ name, ...data }: Thing) {
    this.name = formatString(name);
    Object.assign(this, data);
  }
}
