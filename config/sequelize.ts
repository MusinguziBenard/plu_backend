// config/sequelize.ts
import { Sequelize } from 'sequelize-typescript'
import path from 'path'

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
  models: [
    path.join(__dirname, '../models/User.ts'),
    path.join(__dirname, '../models/Post.ts'),
    path.join(__dirname, '../models/PostLike.ts'),
    path.join(__dirname, '../models/Comment.ts'),
    path.join(__dirname, '../models/CommentLike.ts'),
    path.join(__dirname, '../models/PostView.ts'),  // Make sure this is after Post and User
    path.join(__dirname, '../models/Notification.ts'),
    path.join(__dirname, '../models/UserPushToken.ts'),
    path.join(__dirname, '../models/SavedPost.ts'),
    path.join(__dirname, '../models/Follow.ts'),
    path.join(__dirname, '../models/DirectMessage.ts'),
    path.join(__dirname, '../models/Report.ts'),
    path.join(__dirname, '../models/LiveEvent.ts'),
    path.join(__dirname, '../models/Poll.ts'),
    path.join(__dirname, '../models/PollOption.ts'),
    path.join(__dirname, '../models/PollVote.ts'),
    path.join(__dirname, '../models/Tag.ts'),
    path.join(__dirname, '../models/Invite.ts'),
    path.join(__dirname, '../models/InteractionPreference.ts'),
  ],
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
    connectTimeout: 30000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

export default sequelize