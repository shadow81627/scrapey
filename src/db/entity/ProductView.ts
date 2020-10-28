import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
  SELECT
      t.slug,
      t.name,
      t.description,
      p.gtin13,
      o.name AS brand,
      t.createdAt,
      t.updatedAt
  FROM thing AS t
  INNER JOIN product AS p
      ON t.id = p.thingId
  LEFT JOIN organization_view AS o
     ON p.brandId = o.id
  `
})
export class ProductView {

  @ViewColumn()
  id?: number;

  @ViewColumn()
  name?: string;

  @ViewColumn()
  description?: string;

}