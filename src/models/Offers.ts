import Offer from './Offer';
import Thing from './Thing';

export default class Offers extends Thing {
  '@type': 'AggregateOffer';
  priceCurrency: string = 'USD';
  highPrice?: number;
  lowPrice?: number;
  offerCount?: number;
  offers: Array<Offer> = [];

  constructor({ ...data }: Offers) {
    super(data);
  }
}
