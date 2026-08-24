const { MongoClient } = require('mongodb');

require('dotenv').config();

const OPTIONS = {
  serverSelectionTimeoutMS: 10000,
};

const MONGO_DB_URL = String(process.env.DB_URL || '').trim().replace(/^['"]|['"]$/g, '');
const DB_NAME = process.env.DB_NAME || 'Chat';

let db = null;
const connectionTarget = () => {
  if (!MONGO_DB_URL) return 'DB_URL ausente';
  try {
    return new URL(MONGO_DB_URL).hostname;
  } catch (_error) {
    return 'DB_URL inválida';
  }
};

const connection = () => (db
  ? Promise.resolve(db)
  : (() => {
    console.info(`[MongoDB] Conectando ao host ${connectionTarget()}, banco ${DB_NAME}`);
    if (!MONGO_DB_URL) return Promise.reject(new Error('DB_URL não configurada'));
    return MongoClient.connect(MONGO_DB_URL, OPTIONS);
  })()
  .then((conn) => {
    db = conn.db(DB_NAME);
    console.info(`[MongoDB] Conexão estabelecida com ${connectionTarget()}`);
    return db;
  })
  .catch((error) => {
    console.error(`[MongoDB] Falha na conexão: ${error.name || 'Error'}${error.code ? ` (${error.code})` : ''} - ${error.message}`);
    throw error;
  }));

module.exports = connection;