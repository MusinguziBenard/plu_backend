// models/PollVote.ts - FIXED
import { Table, Column, Model, ForeignKey, BelongsTo, PrimaryKey, DataType, Default } from 'sequelize-typescript'
import { User } from './User'
import { PollOption } from './PollOption'

@Table({ tableName: 'poll_votes', timestamps: false })
export class PollVote extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string

  @BelongsTo(() => User)
  user!: User

  @ForeignKey(() => PollOption)
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false })
  option_id!: string

  @BelongsTo(() => PollOption)
  option!: PollOption

  @Default(new Date())
  @Column({ type: DataType.DATE })
  voted_at!: Date
}