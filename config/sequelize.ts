import { Sequelize } from 'sequelize-typescript'
import path from 'path'

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
  models: [
    path.join(__dirname, '../models/User.ts'),
    path.join(__dirname, '../models/Post.ts'),
    path.join(__dirname, '../models/PostLike.ts')
  ],
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
})

export default sequelize