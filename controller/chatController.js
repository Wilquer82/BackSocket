const chatModel = require('../models/chatModel'); 
const userModel = require('../models/userModel');


async function saveMessage({ nickName, message, time }) {
  try {
    await chatModel.saveMessage(nickName, message, time);
  } catch (error) {
    console.log(error);
  }
}

async function getMessages(_req, res) {
  try {
    const result = await chatModel.getMessages();
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
}

async function saveUser(nickName) {
  try {
    await userModel.saveUser(nickName);
  } catch (error) {
    console.log(error);
  }
}

async function getUsers(_req, res) {
  try {
    const result = await userModel.getUsers();
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
}

async function deleteUser(nickName) {
  try {
    await userModel.deleteUser(nickName);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  saveMessage,
  getMessages,
  saveUser,
  getUsers,
  deleteUser,
};