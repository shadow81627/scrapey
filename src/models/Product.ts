import Offers from './Offers';
import Thing from './Thing';

export default class Product extends Thing {
  '@type' = 'Product';
  brand?: string | object;
  offers?: Offers;

  constructor(data: Product) {
    super(data);
    Object.assign(this, data);
  }
}