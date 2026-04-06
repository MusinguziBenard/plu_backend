// models/CommentLike.ts
import { Table, Column, Model, ForeignKey, BelongsTo, PrimaryKey, DataType } from 'sequelize-typescript'
import { User } from './User'
import { Comment } from './Comment'

@Table({ 
  tableName: 'comment_likes',
  timestamps: false // No need for timestamps on like relationships
})
export class CommentLike extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  user_id!: string

  @ForeignKey(() => Comment)
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  comment_id!: string

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Comment)
  comment!: Comment
}