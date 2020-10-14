import HowToStep from './HowToStep';

export default class HowToSection {
  '@type' = 'HowToSection';
  name?: string;
  position?: string | number;
  itemListElement?: Array<HowToStep>;

  constructor(data: Partial<HowToSection>) {
    Object.assign(this, data);
  }
}
