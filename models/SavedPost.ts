// models/SavedPost.ts
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'

@Table({ tableName: 'saved_posts' })
export class SavedPost extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string

  @BelongsTo(() => User)
  user!: User

  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  post_id!: string

  @BelongsTo(() => Post)
  post!: Post

  @CreatedAt
  created_at!: Date
}