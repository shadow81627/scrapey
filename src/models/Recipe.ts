import NutritionInformation from './NutritionInformation';
import parseInstructions from '../utils/parseInstructions';
import HowToSection from './HowToSection';
import HowToStep from './HowToStep';
import Person from './Person';
import Thing from './Thing';
import { RestrictedDiet } from 'schema-dts';
import RecipeCategory from './RecipeCategory';

export default class Recipe extends Thing {
  '@type' = 'Recipe';
  prepTime?: string;
  totalTime?: string;
  cookTime?: string;
  recipeIngredient?: Array<string>;
  recipeInstructions?: Array<string | HowToSection | HowToStep> = [];
  recipeYield?: string | number;
  recipeCuisine?: string;
  author?: Person;
  video?: Record<string, unknown>;
  nutrition?: NutritionInformation;
  recipeCategory?: RecipeCategory;
  suitableForDiet?: RestrictedDiet;

  constructor({ recipeInstructions = [], ...data }: Recipe) {
    super(data);
    this.recipeInstructions = parseInstructions(recipeInstructions);
  }
}
