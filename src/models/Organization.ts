import Thing from './Thing';

export default class Organization extends Thing {
  '@type' = 'Organization';

  constructor({ ...data }: Organization) {
    super(data);
    Object.assign(this, data);
  }
}
