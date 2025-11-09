import { Table, Column, Model, CreatedAt, UpdatedAt, HasMany, DataType, Default, AllowNull } from 'sequelize-typescript'
import { Post } from './Post'
import { PostLike } from './PostLike'

@Table({ tableName: 'users' })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @AllowNull(false)
  @Column
  name!: string

  @AllowNull(false)
  @Column({ unique: true })
  phone!: string

  @Default('user')
  @Column
  role!: 'user' | 'admin'

  @Column
  location?: string

  @Column
  bio?: string

  @Column
  avatar_url?: string

  @CreatedAt
  created_at!: Date

  @UpdatedAt
  updated_at!: Date

  @HasMany(() => Post)
  posts!: Post[]

  @HasMany(() => PostLike)
  likes!: PostLike[]
}