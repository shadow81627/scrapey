export default class Person {
  '@type' = 'Person';
  name: string;

  constructor({ name, ...data }: Person) {
    Object.assign(this, data);
    this.name = name;
  }
}
