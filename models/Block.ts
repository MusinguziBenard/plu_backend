import { Table, Column, Model, DataType, CreatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'blocks', timestamps: true })
export class Block extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  blocker_id!: string;

  @BelongsTo(() => User, 'blocker_id')
  blocker!: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  blocked_id!: string;

  @BelongsTo(() => User, 'blocked_id')
  blocked!: User;

  @Column({ type: DataType.STRING(255), allowNull: true })
  reason?: string;

  @CreatedAt
  created_at!: Date;
}