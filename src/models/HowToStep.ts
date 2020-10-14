export default class HowToStep {
  '@type' = 'HowToStep';
  text = '';
  image?: string;
  stepImageUrl?: string;

  constructor(data: Partial<HowToStep>) {
    Object.assign(this, data);
  }
}
