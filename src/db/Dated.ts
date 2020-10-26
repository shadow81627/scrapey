import { CreateDateColumn } from "typeorm";

export class Dated {
  @CreateDateColumn({ type: 'timestamp' })
  public createdAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  public updatedAt?: Date;
}