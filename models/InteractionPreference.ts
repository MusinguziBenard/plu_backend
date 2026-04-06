import { Table, Column, Model, ForeignKey, BelongsTo, DataType, Default, CreatedAt, UpdatedAt } from 'sequelize-typescript'
import { User } from './User'

@Table({ tableName: 'interaction_preferences' })
export class InteractionPreference extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  user_id!: string

  @BelongsTo(() => User)
  user!: User

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  notify_on_follow!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  notify_on_like!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  notify_on_comment!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  notify_on_tag!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  notify_on_invite!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  auto_accept_follows!: boolean

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  updated_at!: Date
}