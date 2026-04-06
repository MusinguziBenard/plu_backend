// models/UserPushToken.ts (complete)
import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt,Default } from 'sequelize-typescript'
import { User } from './User'

@Table({ 
  tableName: 'user_push_tokens',
  timestamps: true,
  updatedAt: false
})
export class UserPushToken extends Model {
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
  user_id!: string

  @BelongsTo(() => User)
  user!: User

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    unique: 'unique_user_token' // Composite unique with user_id
  })
  expo_push_token!: string

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  device_name?: string

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  device_os?: string

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active!: boolean

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}