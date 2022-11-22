import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class Dated {
  @CreateDateColumn({ type: 'timestamp' })
  public createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  public deletedAt?: Date;
}
