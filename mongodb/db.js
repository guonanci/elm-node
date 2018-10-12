import mongoose from 'mongoose'
import config from 'config-lite'
import chalk from 'chalk'

mongoose.connect(config.url, { useMongoClient: true })
mongoose.Promise = global.Promise

const db = mongoose.connection

db.once('open', () => {
  console.log(
    chalk.green('Connect to serve succefully!')
  )

})

db.on('error', (error) => {
  console.error(
    chalk.red('Error in MongoDb connect: ' + error)
  );
  mongoose.disconnect()
})

db.on('close', () => {
  console.log(
    chalk.red('Server closed, connect to server again...')
  )
  mongoose.connect(config.url, { server: { auto_reconnect: true }})

})

export default db
