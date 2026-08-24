// userModel.js
const connection = require('./connection');
const { ObjectId } = require('mongodb');

const createUser = async (nickName, passwordHash) => {
  const db = await connection();
  return db.collection('users').insertOne({ _id: new ObjectId(), nickName, passwordHash, createdAt: new Date() });
};

const findUser = async (nickName) => {
  const db = await connection();
  return db.collection('users').findOne({ nickName });
};

module.exports = {
  createUser,
  findUser,
};
