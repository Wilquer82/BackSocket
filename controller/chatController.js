const chatModel = require('../models/chatModel'); 


async function saveMessage({ room, nickName, ciphertext, iv, time }) {
  return chatModel.saveMessage(room, nickName, ciphertext, iv, time);
}

async function getMessages(req, res) {
  try {
    const room = String(req.query.room || '').trim();
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(room)) {
      return res.status(400).json({ error: 'Sala inválida' });
    }
    const result = await chatModel.getMessages(room);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Não foi possível carregar as mensagens' });
  }
}

module.exports = {
  saveMessage,
  getMessages,
};