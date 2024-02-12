const { saveMessage } = require('../controller/chatController');

module.exports = (io) => {
  let users = []; // Certifique-se de que 'users' é uma variável acessível

  io.on('connection', socket => {
    socket.on('saveNickname',async(nickName) => {
      if (!users.includes(nickName)) { // Verifique se o nome de usuário já existe
        users.push(nickName);
        await saveUser(nickName); // Salve o usuário no banco de dados
        io.emit('usersOn', users);
      } else {
        socket.emit('duplicateNickname', nickName); // Emita um evento se o nome de usuário for duplicado
      }
    });
      socket.on('message', data => {
        saveMessage(data);
        io.emit('message', data);
      })
    socket.on('disconnect', nickName => {
      let usersActual = users.filter((item) => item !== nickName);
      console.log(usersActual);
      io.emit('usersOn', usersActual);
    })
    socket.on('userExit', async (nickName) => {
      users = users.filter((item) => item !== nickName);
      await deleteUser(nickName); // Remova o usuário do banco de dados
      io.emit('usersOn', users);
    });
  })
}