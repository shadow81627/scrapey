import formatString from './formatString';

export default function formatIngredient(
  ingredient: { quantity: string | number; ingredient: string } | string,
): string {
  // turn objects into strings
  if (
    typeof ingredient === 'object' &&
    ingredient.quantity &&
    ingredient.ingredient
  ) {
    return formatString(
      `${ingredient.quantity && ingredient.quantity !== 'N/A'
        ? ingredient.quantity
        : ''
      } ${ingredient.ingredient}`,
    );
  } else {
    return formatString(String(ingredient));
  }
}
