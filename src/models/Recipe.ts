import parseInstructions from '../utils/parseInstructions';
import HowToSection from './HowToSection';
import HowToStep from './HowToStep';
import Person from './Person';
import Thing from './Thing';
import ImageObject from './ImageObject';

export default class Recipe extends Thing {
  '@type' = 'Recipe';
  image?: ImageObject;
  prepTime?: string;
  totalTime?: string;
  cookTime?: string;
  recipeIngredient?: Array<any>;
  recipeInstructions?: Array<string | HowToSection | HowToStep> = [];
  recipeYield?: string | number;
  recipeCuisine?: string;
  author?: Person;
  video?: {};

  constructor({ recipeInstructions = [], ...data }: Recipe) {
    super(data);
    this.recipeInstructions = parseInstructions(recipeInstructions);
  }
}
