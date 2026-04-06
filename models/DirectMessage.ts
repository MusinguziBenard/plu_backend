// models/DirectMessage.ts - FIXED ASSOCIATIONS
import { Table, Column, Model, ForeignKey, BelongsTo, HasMany, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'

@Table({ tableName: 'direct_messages' })
export class DirectMessage extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  sender_id!: string

  @BelongsTo(() => User, { foreignKey: 'sender_id', as: 'sender' })
  sender!: User

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  receiver_id!: string

  @BelongsTo(() => User, { foreignKey: 'receiver_id', as: 'receiver' })
  receiver!: User

  @ForeignKey(() => DirectMessage)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  parent_message_id!: string | null

  @BelongsTo(() => DirectMessage, { 
    foreignKey: 'parent_message_id', 
    as: 'parent'  // This is the parent alias
  })
  parent!: DirectMessage | null

  @HasMany(() => DirectMessage, { 
    foreignKey: 'parent_message_id', 
    as: 'replies'  // This is the replies alias
  })
  replies!: DirectMessage[]

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content!: string

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  read!: boolean

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}