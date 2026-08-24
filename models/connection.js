const { MongoClient } = require('mongodb');

require('dotenv').config();

const OPTIONS = {
  serverSelectionTimeoutMS: 10000,
};

const MONGO_DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME || 'Chat';

let db = null;

const connection = () => (db
  ? Promise.resolve(db)
  : MongoClient.connect(MONGO_DB_URL, OPTIONS)
  .then((conn) => {
    db = conn.db(DB_NAME);
    return db;
  }));

module.exports = connection;