import Thing from './Thing';

export default class Person extends Thing {
  '@type' = 'Person';

  constructor({ ...data }: Person) {
    super(data);
    Object.assign(this, data);
  }
}
