const { saveMessage } = require('../controller/chatController');
const { verify } = require('../auth');
const roomModel = require('../models/roomModel');

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validRoom = (room) => /^[a-zA-Z0-9_-]{1,40}$/.test(room);
const validPayload = (value) => value && typeof value === 'object' && !Array.isArray(value);

module.exports = (io) => {
  const usersByRoom = new Map();
  const emitRoomUsers = (room) => io.to(room).emit('usersOn', [...(usersByRoom.get(room) || [])]);

  io.on('connection', (socket) => {
    socket.use(([event, data], next) => {
      if (event !== 'joinRoom') return next();
      const user = verify(data?.token);
      const access = verify(data?.accessToken);
      if (!user || !access || user.userId !== data.userId || access.userId !== data.userId || user.nickName !== data.nickName || access.room !== data.room || access.access !== true) return next(new Error('Autenticação inválida'));
      socket.data.user = user;
      return next();
    });
    socket.on('joinRoom', ({ room, nickName, ghost } = {}, done = () => {}) => {
      room = clean(room, 40);
      nickName = clean(nickName, 30);
      if (!validRoom(room) || !/^[\p{L}0-9 _-]{2,30}$/u.test(nickName)) {
        return done({ ok: false, error: 'Sala ou apelido inválido' });
      }
      roomModel.findRoom(room).then((roomData) => {
        if (!roomData || roomData.blocked) return done({ ok: false, error: 'Sala indisponível' });
        const isGhost = Boolean(ghost) && process.env.GHOST_ADMIN_SECRET && ghost === process.env.GHOST_ADMIN_SECRET;
        const visibleName = nickName;
        const users = usersByRoom.get(room) || new Set();
        if (!isGhost && users.has(visibleName)) return done({ ok: false, error: 'Apelido já está em uso nesta sala' });
        if (!isGhost) { users.add(visibleName); usersByRoom.set(room, users); }
        socket.data.room = room;
        socket.data.nickName = visibleName;
        socket.join(room);
        emitRoomUsers(room);
        return done({ ok: true, room, nickName: visibleName, ghost: isGhost });
      }).catch(() => done({ ok: false, error: 'Não foi possível entrar na sala' }));
    });

    socket.on('message', async (data = {}, done = () => {}) => {
      const room = socket.data.room;
      if (!validPayload(data)) return done({ ok: false, error: 'Mensagem inválida' });
      const ciphertext = clean(data.ciphertext, 20000);
      const iv = clean(data.iv, 100);
      if (!room || !ciphertext || !iv || !socket.data.nickName) return done({ ok: false, error: 'Mensagem inválida' });
      const message = { room, nickName: socket.data.nickName, ciphertext, iv, time: new Date().toISOString() };
      try {
        if (!(await roomModel.findRoom(room))) return done({ ok: false, error: 'Sala indisponível' });
        await saveMessage(message);
        io.to(room).emit('message', message);
        done({ ok: true });
      } catch (_error) {
        done({ ok: false, error: 'Mensagem não pôde ser salva' });
      }
    });

    const leave = () => {
      const { room, nickName } = socket.data;
      if (!room) return;
      const users = usersByRoom.get(room);
      users?.delete(nickName);
      if (users?.size === 0) usersByRoom.delete(room);
      emitRoomUsers(room);
      socket.data.room = null;
    };
    socket.on('disconnect', leave);
    socket.on('userExit', leave);
  });
};
