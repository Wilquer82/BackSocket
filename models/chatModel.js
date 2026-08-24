const connection = require('./connection');

const saveMessage = async (room, nickName, ciphertext, iv, time) => {
  const db = await connection();

  const newMessage = await db.collection('Chat')
    .insertOne({ room, nickName, ciphertext, iv, time, createdAt: new Date() });
  return newMessage;
};

const getMessages = async (room) => {
  const db = await connection();
  return db.collection('Chat').find({ room }).sort({ createdAt: -1 }).limit(30).toArray();
};

const deleteMessages = async (room) => {
  const db = await connection();
  return db.collection('Chat').deleteMany({ room });
};

module.exports = {
  saveMessage,
  getMessages,
  deleteMessages,
};