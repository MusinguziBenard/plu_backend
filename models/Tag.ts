import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'
import { Post } from './Post'

@Table({ tableName: 'tags' })
export class Tag extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  tagger_id!: string

  @BelongsTo(() => User, { foreignKey: 'tagger_id' })
  tagger!: User

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  tagged_id!: string

  @BelongsTo(() => User, { foreignKey: 'tagged_id' })
  tagged!: User

  @ForeignKey(() => Post)
  @Column({ type: DataType.UUID, allowNull: false })
  post_id!: string

  @BelongsTo(() => Post)
  post!: Post

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  notified!: boolean

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date
}