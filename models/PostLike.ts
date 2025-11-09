import { Table, Column, Model, ForeignKey, BelongsTo, PrimaryKey, DataType } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'

@Table({ 
  tableName: 'post_likes',
  timestamps: false 
})
export class PostLike extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column(DataType.UUID)
  user_id!: string

  @ForeignKey(() => Post)
  @PrimaryKey
  @Column(DataType.UUID)
  post_id!: string

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Post)
  post!: Post
}