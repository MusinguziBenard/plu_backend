// // models/Post.ts (Updated with VARCHAR instead of ENUM)
// import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default, HasMany } from 'sequelize-typescript'
// import { User } from './User'
// import { PostLike } from './PostLike'
// import { Comment } from './Comment'
// import { PostView } from './PostView'

// @Table({ tableName: 'posts' })
// export class Post extends Model {
//   @Column({
//     type: DataType.UUID,
//     defaultValue: DataType.UUIDV4,
//     primaryKey: true,
//   })
//   id!: string

//   @ForeignKey(() => User)
//   @Column({
//     type: DataType.UUID,
//     allowNull: false
//   })
//   user_id!: string

//   @BelongsTo(() => User)
//   user!: User

//   @Column({
//     type: DataType.STRING(255),
//     allowNull: false
//   })
//   title!: string

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true,
//     defaultValue: ''
//   })
//   description!: string

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true
//   })
//   photo_url?: string

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true
//   })
//   video_url?: string

//   @Default('pending')
//   @Column({
//     type: DataType.STRING(20), // Changed from ENUM to STRING
//     allowNull: false
//   })
//   status!: 'pending' | 'posted' | 'rejected'

//   @Column({
//     type: DataType.STRING(20), // Changed from ENUM to STRING
//     allowNull: false
//   })
//   category!: 'rally' | 'news' | 'community' | 'service' | 'poster' | 'entertainment'

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   views_count!: number

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   likes_count!: number

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   comments_count!: number

//   @CreatedAt
//   @Column({
//     type: DataType.DATE,
//     defaultValue: DataType.NOW
//   })
//   created_at!: Date

//   // Associations
//   @HasMany(() => PostLike)
//   likes!: PostLike[]

//   @HasMany(() => Comment)
//   comments!: Comment[]

//   @HasMany(() => PostView)
//   views!: PostView[]
// }

// models/Post.ts - CORRECTED (removed PostView association)
import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default, HasMany } from 'sequelize-typescript'
import { User } from './User'
import { PostLike } from './PostLike'
import { Comment } from './Comment'
// import { PostView } from './PostView'  // REMOVE THIS LINE

@Table({ tableName: 'posts' })
export class Post extends Model {
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
    type: DataType.STRING(255),
    allowNull: false
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: ''
  })
  description!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  photo_url?: string

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  video_url?: string

  @Default('pending')
  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  status!: 'pending' | 'posted' | 'rejected'

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  category!: 'rally' | 'news' | 'community' | 'service' | 'poster' | 'entertainment'

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  views_count!: number

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
  comments_count!: number

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date

  // Associations
  @HasMany(() => PostLike)
  likes!: PostLike[]

  @HasMany(() => Comment)
  comments!: Comment[]

  // REMOVE THIS BLOCK:
  // @HasMany(() => PostView)
  // views!: PostView[]
}