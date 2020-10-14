import Offer from './Offer';

export default interface Offers {
  '@type': 'AggregateOffer';
  priceCurrency: string;
  highPrice?: number;
  lowPrice?: number;
  offerCount?: number;
  offers: Array<Offer>;
}
