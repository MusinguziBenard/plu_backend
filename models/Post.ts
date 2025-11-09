import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default, HasMany } from 'sequelize-typescript'
import { User } from './User'
import { PostLike } from './PostLike'

@Table({ tableName: 'posts' })
export class Post extends Model {
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

  @Column
  title!: string

  @Column
  description!: string

  @Column
  photo_url?: string

  @Column
  video_url?: string

  @Default('pending')
  @Column
  status!: 'pending' | 'posted' | 'rejected'

  @Column
  category!: 'rally' | 'news' | 'community' | 'service' | 'poster' | 'entertainment'

  @CreatedAt
  created_at!: Date

  @HasMany(() => PostLike)
  likes!: PostLike[]
}