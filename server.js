const mongoose = require('mongoose');
const dotenv = require('dotenv');
// require('./initial-data/script');

dotenv.config({ path: './config.env' });

const app = require('./app');

let dbUri = process.env.DB_URI.replace('<password>', process.env.DB_PASSWORD);

mongoose.connect(dbUri).then(() => {
  console.log('Successfully connected to database.');
});

const port = process.env.PORT;
app.listen(port, () => console.log('Server is listening.'));
