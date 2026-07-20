import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'call_rooms', timestamps: true })
export class CallRoom extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(50), unique: true })
  room_id!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  caller_id!: string;

  @BelongsTo(() => User, 'caller_id')
  caller!: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  callee_id?: string;

  @BelongsTo(() => User, 'callee_id')
  callee?: User;

  @Default('pending')
  @Column({ type: DataType.ENUM('pending', 'active', 'ended', 'missed', 'rejected'), defaultValue: 'pending' })
  status!: string;

  @Column({ type: DataType.ENUM('audio', 'video', 'conference'), defaultValue: 'audio' })
  call_type!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_group_call!: boolean;

  @Column(DataType.JSONB)
  participants?: any[];

  @Column(DataType.DATE)
  started_at?: Date;

  @Column(DataType.DATE)
  ended_at?: Date;

  @Column(DataType.INTEGER)
  duration?: number;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;
}