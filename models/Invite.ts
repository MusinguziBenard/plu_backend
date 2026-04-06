import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'

@Table({ tableName: 'invites' })
export class Invite extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  inviter_id!: string

  @BelongsTo(() => User, { foreignKey: 'inviter_id' })
  inviter!: User

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  invitee_id!: string

  @BelongsTo(() => User, { foreignKey: 'invitee_id' })
  invitee!: User

  @Default('pending')
  @Column({ type: DataType.STRING(20), defaultValue: 'pending' })
  status!: string

  @Default('event')
  @Column({ type: DataType.STRING(20), defaultValue: 'event' })
  type!: string

  @Column({ type: DataType.UUID, allowNull: false })
  reference_id!: string

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date
}