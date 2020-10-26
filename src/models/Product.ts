import Offers from './Offers';
import Organization from './Organization';
import Thing from './Thing';

export default class Product extends Thing {
  '@type' = 'Product';
  brand?: string | Organization;
  offers?: Offers;

  constructor(data: Product) {
    super(data);
    Object.assign(this, data);
  }
}
