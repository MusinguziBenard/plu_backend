// models/Follow.ts
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType } from 'sequelize-typescript'
import { User } from './User'

@Table({ tableName: 'follows' })
export class Follow extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  follower_id!: string  // User who follows

  @BelongsTo(() => User, { foreignKey: 'follower_id', as: 'follower' })
  follower!: User

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  following_id!: string  // User being followed

  @BelongsTo(() => User, { foreignKey: 'following_id', as: 'following' })
  following!: User

  @CreatedAt
  created_at!: Date
}