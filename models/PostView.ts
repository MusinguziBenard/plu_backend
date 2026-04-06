// models/PostView.ts - CLEAN VERSION
import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt } from 'sequelize-typescript'
import { User } from './User'

@Table({ 
  tableName: 'post_views',
  timestamps: true,
  updatedAt: false
})
export class PostView extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  user_id!: string | null

  @BelongsTo(() => User)
  user!: User | null

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  entity_type!: 'post' | 'comment' | 'event' | 'poll' | 'user'

  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  entity_id!: string

  @Column({
    type: DataType.INET,
    allowNull: true
  })
  ip_address!: string | null

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  user_agent!: string | null

  @CreatedAt
  viewed_at!: Date
}