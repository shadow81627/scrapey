import { head, map } from 'lodash';
import Offer from './Offer';
import Thing from './Thing';

export default class Offers extends Thing {
  '@type': 'AggregateOffer';
  priceCurrency = 'USD';
  highPrice?: number;
  lowPrice?: number;
  offerCount?: number;
  offers: Array<Offer> = [];

  constructor({ ...data }: Offers) {
    super(data);
    this.priceCurrency = head(map(this.offers, 'priceCurrency'));
    this.highPrice = Math.max(...map(this.offers, 'price'));
    this.lowPrice = Math.min(...map(this.offers, 'price'));
    this.offerCount = this.offers.length;
  }
}
