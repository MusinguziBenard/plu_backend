// models/Comment.ts - WITH CASCADE DELETE
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default, HasMany } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'

@Table({ 
  tableName: 'comments',
  timestamps: true,
  updatedAt: false // Comments are immutable after creation
})
export class Comment extends Model {
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

  @ForeignKey(() => Post)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  post_id!: string

  @BelongsTo(() => Post)
  post!: Post

  // Self-referential relationship for replies
  @ForeignKey(() => Comment)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  parent_comment_id!: string | null

  @BelongsTo(() => Comment, { 
    foreignKey: 'parent_comment_id', 
    as: 'parent',
    onDelete: 'CASCADE'  // Add this
  })
  parent!: Comment | null

  @HasMany(() => Comment, { 
    foreignKey: 'parent_comment_id', 
    as: 'replies',
    onDelete: 'CASCADE'  // Add this
  })
  replies!: Comment[]

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content!: string

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  likes_count!: number

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  replies_count!: number

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}