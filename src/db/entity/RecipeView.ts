import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
  SELECT
      t.slug,
      t.name,
      t.description,
      a.name as 'author',
      r.prepTime,
      r.cookTime,
      r.recipeYield,
      r.recipeCuisine,
      r.keywords,
      t.createdAt,
      t.updatedAt
  FROM thing AS t
  INNER JOIN recipe AS r
      ON t.id = r.thingId
  LEFT JOIN thing as a
      ON r.authorId = a.id
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