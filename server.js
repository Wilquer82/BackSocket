const express = require('express');
const app = express();
const { getMessages } = require('./controller/chatController');
const { saveUser, getUsers, deleteUser } = require('./models/userModel');
const server = require('http').createServer(app);
const cors = require('cors')
const PORT = process.env.PORT || 8080;

const options = {
    methods: ['GET', 'POST', 'DELETE'],
    origin:'*', 
    credentials: true,  
    optionSuccessStatus: 200,
  }

  

app.use(cors(options));

app.use(express.json());

const io = require('socket.io')(server, {
  cors: options
});

require('./sockets/chat')(io);

app.get('/', getMessages); 
app.use('/get', getMessages);

// Rotas para usuários
app.get('/users', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const { nickName } = req.body;
  const newUser = await saveUser(nickName);
  res.json(newUser);
});

app.delete('/users/:nickName', async (req, res) => {
  const { nickName } = req.params;
  await deleteUser(nickName);
  res.json({ message: 'Usuário deletado com sucesso' });
});


server.listen(PORT, () => {
  console.log(`Porta ${PORT}`);
});