// // models/LiveEvent.ts - FIXED (use VARCHAR instead of ENUM)
// import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
// import { User } from './User'

// @Table({ tableName: 'live_events' })
// export class LiveEvent extends Model {
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
//   created_by!: string

//   @BelongsTo(() => User)
//   creator!: User

//   @Column({
//     type: DataType.STRING(255),
//     allowNull: false
//   })
//   title!: string

//   @Column({
//     type: DataType.TEXT,
//     allowNull: true
//   })
//   description!: string

//   @Column({
//     type: DataType.TEXT,
//     allowNull: false
//   })
//   stream_url!: string

//   @Column({
//     type: DataType.DATE,
//     allowNull: false
//   })
//   scheduled_start!: Date

//   @Column({
//     type: DataType.DATE,
//     allowNull: true
//   })
//   scheduled_end!: Date

//   @Default('scheduled')
//   @Column({
//     type: DataType.STRING(20),  // Changed from ENUM to STRING
//     allowNull: false
//   })
//   status!: 'scheduled' | 'live' | 'ended' | 'cancelled'

//   @Default(0)
//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0
//   })
//   viewer_count!: number

//   @CreatedAt
//   @Column({
//     type: DataType.DATE,
//     defaultValue: DataType.NOW
//   })
//   created_at!: Date
// }



import { Table, Column, Model, ForeignKey, BelongsTo, CreatedAt, DataType, Default } from 'sequelize-typescript'
import { User } from './User'

@Table({ tableName: 'live_events' })
export class LiveEvent extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  created_by!: string

  @BelongsTo(() => User)
  user!: User

  @Column({ type: DataType.STRING(255), allowNull: false })
  title!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  image_url!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  stream_url!: string

  @Column({ type: DataType.DATE, allowNull: false })
  scheduled_start!: Date

  @Column({ type: DataType.DATE, allowNull: true })
  scheduled_end!: Date

  @Default('scheduled')
  @Column({ type: DataType.STRING(20), allowNull: false })
  status!: string

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  viewer_count!: number

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_featured!: boolean

  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date
}