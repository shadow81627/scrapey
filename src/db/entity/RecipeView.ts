import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
  SELECT
      t.slug,
      t.name,
      t.description,
      r.prepTime,
      r.totalTime,
      r.cookTime,
      r.recipeYield,
      r.recipeCuisine,
      t.createdAt,
      t.updatedAt
  FROM thing AS t
  INNER JOIN recipe AS r
      ON t.id = r.thingId
  `
})
export class RecipeView {

  @ViewColumn()
  id?: number;

  @ViewColumn()
  name?: string;

  @ViewColumn()
  description?: string;

}