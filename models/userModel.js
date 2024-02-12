// userModel.js
const connection = require('./connection');

const saveUser = async (nickName) => {
  const db = await connection();
  const newUser = await db.collection('Users').insertOne({ nickName });
  return newUser;
};

const getUsers = async () => {
  const db = await connection();
  return db.collection('Users').find().toArray();
};

const deleteUser = async (nickName) => {
  const db = await connection();
  return db.collection('Users').deleteOne({ nickName });
};

module.exports = {
  saveUser,
  getUsers,
  deleteUser,
};
