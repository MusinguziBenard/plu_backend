// // models/User.ts - COMPLETE WITH ALL RELATIONSHIPS
// import { Table, Column, Model, CreatedAt, UpdatedAt, HasMany, DataType, Default, AllowNull } from 'sequelize-typescript'
// import { Post } from './Post'
// import { PostLike } from './PostLike'
// import { Comment } from './Comment'
// import { CommentLike } from './CommentLike'
// import { PostView } from './PostView'
// import { Notification } from './Notification'
// import { UserPushToken } from './UserPushToken'
// import { SavedPost } from './SavedPost'
// import { Follow } from './Follow'
// import { DirectMessage } from './DirectMessage'
// import { Report } from './Report'
// import { PollVote } from './PollVote'
// import { LiveEvent } from './LiveEvent'

// @Table({ tableName: 'users' })
// export class User extends Model {
//   @Column({
//     type: DataType.UUID,
//     defaultValue: DataType.UUIDV4,
//     primaryKey: true,
//   })
//   id!: string

//   @AllowNull(false)
//   @Column
//   name!: string

//   @AllowNull(false)
//   @Column({ unique: true })
//   phone!: string

//   @Default('user')
//   @Column
//   role!: 'user' | 'admin'

//   @Column
//   location?: string

//   @Column
//   bio?: string

//   @Column
//   avatar_url?: string

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   followers_count!: number

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   following_count!: number

//   @CreatedAt
//   created_at!: Date

//   @UpdatedAt
//   updated_at!: Date

//   // ============================================
//   // ASSOCIATIONS
//   // ============================================

//   @HasMany(() => Post, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   posts!: Post[]

//   @HasMany(() => PostLike, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   likes!: PostLike[]

//   @HasMany(() => Comment, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   comments!: Comment[]

//   @HasMany(() => CommentLike, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   commentLikes!: CommentLike[]

//   @HasMany(() => PostView, {
//     foreignKey: 'user_id',
//     onDelete: 'SET NULL'
//   })
//   views!: PostView[]

//   @HasMany(() => Notification, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   notifications!: Notification[]

//   @HasMany(() => Notification, {
//     foreignKey: 'actor_id',
//     onDelete: 'SET NULL'
//   })
//   actedNotifications!: Notification[]

//   @HasMany(() => UserPushToken, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   pushTokens!: UserPushToken[]

//   @HasMany(() => SavedPost, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   savedPosts!: SavedPost[]

//   // Follow relationships
//   @HasMany(() => Follow, {
//     foreignKey: 'follower_id',
//     as: 'following',
//     onDelete: 'CASCADE'
//   })
//   following!: Follow[]

//   @HasMany(() => Follow, {
//     foreignKey: 'following_id',
//     as: 'followers',
//     onDelete: 'CASCADE'
//   })
//   followers!: Follow[]

//   // Direct Messages
//   @HasMany(() => DirectMessage, {
//     foreignKey: 'sender_id',
//     as: 'sentMessages',
//     onDelete: 'CASCADE'
//   })
//   sentMessages!: DirectMessage[]

//   @HasMany(() => DirectMessage, {
//     foreignKey: 'receiver_id',
//     as: 'receivedMessages',
//     onDelete: 'CASCADE'
//   })
//   receivedMessages!: DirectMessage[]

//   // Reports
//   @HasMany(() => Report, {
//     foreignKey: 'reporter_id',
//     as: 'reports',
//     onDelete: 'CASCADE'
//   })
//   reports!: Report[]

//   // Poll Votes
//   @HasMany(() => PollVote, {
//     foreignKey: 'user_id',
//     onDelete: 'CASCADE'
//   })
//   pollVotes!: PollVote[]

//   // Live Events
//   @HasMany(() => LiveEvent, {
//     foreignKey: 'created_by',
//     onDelete: 'SET NULL'
//   })
//   createdEvents!: LiveEvent[]
// }




// models/User.ts - CLEANED UP (no duplicates)
import { Table, Column, Model, CreatedAt, UpdatedAt, HasMany, DataType, Default, AllowNull } from 'sequelize-typescript'
import { Post } from './Post'
import { PostLike } from './PostLike'
import { Comment } from './Comment'
import { CommentLike } from './CommentLike'
import { PostView } from './PostView'
import { Notification } from './Notification'
import { UserPushToken } from './UserPushToken'
import { SavedPost } from './SavedPost'
import { Follow } from './Follow'
import { DirectMessage } from './DirectMessage'
import { Report } from './Report'
import { PollVote } from './PollVote'
import { LiveEvent } from './LiveEvent'

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

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  followers_count!: number

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  following_count!: number

  @CreatedAt
  created_at!: Date

  @UpdatedAt
  updated_at!: Date

  // ============================================
  // ASSOCIATIONS
  // ============================================

  @HasMany(() => Post, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  posts!: Post[]

  @HasMany(() => PostLike, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  likes!: PostLike[]

  @HasMany(() => Comment, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  comments!: Comment[]

  @HasMany(() => CommentLike, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  commentLikes!: CommentLike[]

  @HasMany(() => PostView, {
    foreignKey: 'user_id',
    onDelete: 'SET NULL'
  })
  views!: PostView[]

  @HasMany(() => Notification, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  notifications!: Notification[]

  @HasMany(() => Notification, {
    foreignKey: 'actor_id',
    onDelete: 'SET NULL'
  })
  actedNotifications!: Notification[]

  @HasMany(() => UserPushToken, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  pushTokens!: UserPushToken[]

  @HasMany(() => SavedPost, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  savedPosts!: SavedPost[]

  // Follow relationships
  @HasMany(() => Follow, {
    foreignKey: 'follower_id',
    as: 'following',
    onDelete: 'CASCADE'
  })
  following!: Follow[]

  @HasMany(() => Follow, {
    foreignKey: 'following_id',
    as: 'followers',
    onDelete: 'CASCADE'
  })
  followers!: Follow[]

  // Direct Messages
  @HasMany(() => DirectMessage, {
    foreignKey: 'sender_id',
    as: 'sentMessages',
    onDelete: 'CASCADE'
  })
  sentMessages!: DirectMessage[]

  @HasMany(() => DirectMessage, {
    foreignKey: 'receiver_id',
    as: 'receivedMessages',
    onDelete: 'CASCADE'
  })
  receivedMessages!: DirectMessage[]

  // Reports
  @HasMany(() => Report, {
    foreignKey: 'reporter_id',
    as: 'reports',
    onDelete: 'CASCADE'
  })
  reports!: Report[]

  // Poll Votes (only once!)
  @HasMany(() => PollVote, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  })
  pollVotes!: PollVote[]

  // Live Events
  @HasMany(() => LiveEvent, {
    foreignKey: 'created_by',
    onDelete: 'SET NULL'
  })
  createdEvents!: LiveEvent[]
}