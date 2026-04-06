// models/Report.ts - FIXED (use VARCHAR instead of ENUM)
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'
import { Comment } from './Comment'

@Table({ tableName: 'reports' })
export class Report extends Model {
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
  reporter_id!: string

  @BelongsTo(() => User, { foreignKey: 'reporter_id', as: 'reporter' })
  reporter!: User

  @ForeignKey(() => Post)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  post_id!: string | null

  @BelongsTo(() => Post)
  post!: Post | null

  @ForeignKey(() => Comment)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  comment_id!: string | null

  @BelongsTo(() => Comment)
  comment!: Comment | null

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  reason!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string

  @Default('pending')
  @Column({
    type: DataType.STRING(20),  // Changed from ENUM to STRING
    allowNull: false
  })
  status!: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}