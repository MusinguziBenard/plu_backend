// // models/Poll.ts - FIXED
// import { Table, Column, Model, ForeignKey, BelongsTo, HasMany, CreatedAt, DataType, Default } from 'sequelize-typescript'
// import { User } from './User'
// import { Post } from './Post'
// import { PollOption } from './PollOption'

// @Table({ tableName: 'polls' })
// export class Poll extends Model {
//   @Column({
//     type: DataType.UUID,
//     defaultValue: DataType.UUIDV4,
//     primaryKey: true,
//   })
//   id!: string

//   @ForeignKey(() => Post)
//   @Column({
//     type: DataType.UUID,
//     allowNull: false
//   })
//   post_id!: string

//   @BelongsTo(() => Post)
//   post!: Post

//   @Column({
//     type: DataType.STRING(255),
//     allowNull: false
//   })
//   question!: string

//   @Default(false)
//   @Column({
//     type: DataType.BOOLEAN,
//     defaultValue: false
//   })
//   is_multiple!: boolean

//   @Default(true)
//   @Column({
//     type: DataType.BOOLEAN,
//     defaultValue: true
//   })
//   is_active!: boolean

//   @Column({
//     type: DataType.DATE,  // Changed from TIMESTAMP to DATE
//     allowNull: true
//   })
//   ends_at!: Date

//   @CreatedAt
//   @Column({
//     type: DataType.DATE,
//     defaultValue: DataType.NOW
//   })
//   created_at!: Date

//   // Association with PollOptions
//   @HasMany(() => PollOption, {
//     foreignKey: 'poll_id',
//     onDelete: 'CASCADE'
//   })
//   options!: PollOption[]
// }

import { Table, Column, Model, ForeignKey, BelongsTo, HasMany, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'
import { PollOption } from './PollOption'

@Table({ tableName: 'polls' })
export class Poll extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => Post)
  @Column({ type: DataType.UUID, allowNull: true })
  post_id!: string | null

  @BelongsTo(() => Post)
  post!: Post | null

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  created_by!: string

  // Add both associations for flexibility
  @BelongsTo(() => User, { foreignKey: 'created_by' })
  user!: User

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  creator!: User

  @Column({ type: DataType.STRING(255), allowNull: false })
  question!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_multiple!: boolean

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active!: boolean

  @Column({ type: DataType.DATE, allowNull: true })
  ends_at!: Date | null

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  total_votes!: number

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date

  @HasMany(() => PollOption, { foreignKey: 'poll_id', onDelete: 'CASCADE' })
  options!: PollOption[]
}