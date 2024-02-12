const { saveMessage } = require('../controller/chatController');

module.exports = (io) => {
  let users = []; // Certifique-se de que 'users' é uma variável acessível

  io.on('connection', socket => {
    socket.on('saveNickname', nickName => {
      if (!users.includes(nickName)) {
        users.push(nickName);
        io.emit('usersOn', users);
      } else {
        socket.emit('duplicateNickname', nickName); // Emita o evento apenas para o cliente atual
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
    socket.on('userExit', nickName => { // Ouça o evento 'userExit'
      users = users.filter((item) => item !== nickName);
      io.emit('usersOn', users);
    });

  })
}