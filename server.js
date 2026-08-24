require('dotenv').config();

const express = require('express');
const app = express();
const { getMessages } = require('./controller/chatController');
const { createUser, findUser } = require('./models/userModel');
const roomModel = require('./models/roomModel');
const { sign, hashPassword, checkPassword, authenticate, authenticateRoom } = require('./auth');
const connection = require('./models/connection');
const server = require('http').createServer(app);
const cors = require('cors');
const helmet = require('helmet');
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || !process.env.GHOST_ADMIN_SECRET)) {
  throw new Error('AUTH_SECRET e GHOST_ADMIN_SECRET devem ser configurados em produção');
}
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://webchat-mongo-socket-io-nodejs-reactjs.onrender.com,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const options = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(options));
app.options('*', cors(options));
app.use(helmet());

app.use(express.json({ limit: '32kb' }));

const io = require('socket.io')(server, {
  cors: options,
  maxHttpBufferSize: 64 * 1024,
});

require('./sockets/chat')(io);
connection().then((db) => Promise.all([
  db.collection('users').createIndex({ nickName: 1 }, { unique: true }),
  db.collection('rooms').createIndex({ slug: 1 }, { unique: true }),
  db.collection('Chat').createIndex({ room: 1, createdAt: -1 }),
])).catch((error) => console.error('Falha ao criar índices:', error.message));

app.get('/', authenticate, authenticateRoom, getMessages);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/auth/register', async (req, res) => {
  const nickName = String(req.body.nickName || '').trim();
  const password = String(req.body.password || '');
  if (!/^[\p{L}0-9 _-]{2,30}$/u.test(nickName) || password.length < 8) return res.status(400).json({ error: 'Apelido ou senha inválidos' });
  if (await findUser(nickName)) return res.status(409).json({ error: 'Esse apelido já está cadastrado' });
  const result = await createUser(nickName, await hashPassword(password));
  return res.status(201).json({ token: sign({ userId: result.insertedId.toString(), nickName }), userId: result.insertedId.toString(), nickName });
});

app.post('/auth/login', async (req, res) => {
  const nickName = String(req.body.nickName || '').trim();
  const password = String(req.body.password || '');
  const user = await findUser(nickName);
  if (!user || !user.passwordHash || !(await checkPassword(password, user.passwordHash))) return res.status(401).json({ error: 'Apelido ou senha incorretos' });
  return res.json({ token: sign({ userId: user._id.toString(), nickName: user.nickName }), userId: user._id.toString(), nickName: user.nickName });
});

app.get('/rooms', authenticate, async (_req, res) => res.json(await roomModel.listRooms()));
app.post('/rooms', authenticate, async (req, res) => {
  const slug = String(req.body.slug || '').trim().toLowerCase();
  const name = String(req.body.name || slug).trim().slice(0, 60);
  const password = String(req.body.password || '');
  if (!/^[a-z0-9_-]{1,40}$/.test(slug) || password.length < 8) return res.status(400).json({ error: 'Sala ou senha inválida' });
  if (await roomModel.findRoom(slug)) return res.status(409).json({ error: 'Essa sala já existe' });
  await roomModel.createRoom({ slug, name, passwordHash: await hashPassword(password), owner: req.user.nickName, ownerId: req.user.userId, hidden: Boolean(req.body.hidden) });
  return res.status(201).json({ slug, name, hidden: Boolean(req.body.hidden), owner: req.user.nickName, blocked: false });
});
app.post('/rooms/:slug/verify', authenticate, async (req, res) => {
  const room = await roomModel.findRoom(req.params.slug);
  if (!room || room.blocked) return res.status(404).json({ error: 'Sala indisponível' });
  if (!(await checkPassword(String(req.body.password || ''), room.passwordHash))) return res.status(403).json({ error: 'Senha da sala incorreta' });
  return res.json({ ok: true, room: roomModel.publicRoom(room), accessToken: sign({ userId: req.user.userId, nickName: req.user.nickName, room: room.slug, access: true }) });
});
app.patch('/rooms/:slug', authenticate, async (req, res) => {
  const room = await roomModel.findRoom(req.params.slug);
  if (!room || room.ownerId !== req.user.userId) return res.status(403).json({ error: 'Apenas o dono pode bloquear a sala' });
  await roomModel.updateRoom(req.params.slug, { blocked: Boolean(req.body.blocked) });
  return res.json({ ok: true, blocked: Boolean(req.body.blocked) });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Porta ${PORT}`);
});