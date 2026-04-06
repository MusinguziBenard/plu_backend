// models/PollOption.ts - WITH HAS MANY
import { Table, Column, Model, ForeignKey, BelongsTo, HasMany, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { Poll } from './Poll'
import { PollVote } from './PollVote'

@Table({ tableName: 'poll_options' })
export class PollOption extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => Poll)
  @Column({ type: DataType.UUID, allowNull: false })
  poll_id!: string

  @BelongsTo(() => Poll)
  poll!: Poll

  @Column({ type: DataType.STRING(255), allowNull: false })
  option_text!: string

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  votes_count!: number

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date

  @HasMany(() => PollVote, { foreignKey: 'option_id' })
  votes!: PollVote[]
}