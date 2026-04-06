// models/PostLike.ts - WITHOUT timestamps, just created_at
import { Table, Column, Model, ForeignKey, BelongsTo, PrimaryKey, DataType, CreatedAt } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'

@Table({ 
  tableName: 'post_likes',
  timestamps: false  // Keep false to avoid updatedAt
})
export class PostLike extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  user_id!: string

  @ForeignKey(() => Post)
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  post_id!: string

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Post)
  post!: Post

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date
}