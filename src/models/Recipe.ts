import formatString from '../utils/formatString';
import parseInstructions from '../utils/parseInstructions';
import HowToSection from './HowToSection';
import HowToStep from './HowToStep';
import Person from './Person';
import Thing from './Thing';

export default class Recipe extends Thing {
  '@type'? = 'Recipe';
  prepTime?: string;
  totalTime?: string;
  cookTime?: string;
  recipeIngredient?: Array<any>;
  recipeInstructions?: Array<string | HowToSection | HowToStep> = [];
  author?: Person;
  video?: {};

  constructor({ recipeInstructions = [], ...data }: Recipe) {
    super(data);
    this.recipeInstructions = parseInstructions(recipeInstructions);
  }
}
