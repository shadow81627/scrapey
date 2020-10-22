import Thing from './Thing';

export default class Offer extends Thing {
  offeredBy: string;

  constructor({ offeredBy, ...data }: Offer) {
    super(data);
    this.offeredBy = offeredBy;
  }
}
