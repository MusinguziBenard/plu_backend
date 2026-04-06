// models/Notification.ts (complete)
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'

@Table({ 
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false // Notifications don't change after creation
})
export class Notification extends Model {
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
    type: DataType.ENUM('like', 'comment', 'comment_reply', 'comment_like', 'post_approved', 'post_rejected', 'new_post'),
    allowNull: false
  })
  type!: 'like' | 'comment' | 'comment_reply' | 'comment_like' | 'post_approved' | 'post_rejected' | 'new_post'

  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  reference_id!: string // post_id, comment_id, or parent_comment_id

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true // Can be null for system notifications
  })
  actor_id!: string | null

  @BelongsTo(() => User, { foreignKey: 'actor_id', as: 'actor' })
  actor!: User | null

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  message!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  image_url?: string

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  read!: boolean

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  push_sent!: boolean

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}