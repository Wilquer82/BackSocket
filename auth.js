const crypto = require('crypto');

const secret = process.env.AUTH_SECRET || 'change-this-secret-in-production';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (payload) => {
  const body = encode({ ...payload, exp: Date.now() + (7 * 24 * 60 * 60 * 1000) });
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
};
const verify = (token) => {
  try {
    const [body, signature] = String(token || '').split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!body || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch (_error) { return null; }
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString('hex')}`));
});
const checkPassword = (password, stored) => new Promise((resolve, reject) => {
  const [salt, hash] = String(stored || '').split(':');
  crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) return reject(error);
    const actual = key.toString('hex');
    return resolve(Boolean(hash && actual.length === hash.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(hash))));
  });
});
const authenticate = (req, res, next) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  req.user = verify(token);
  if (!req.user) return res.status(401).json({ error: 'Autenticação necessária' });
  return next();
};
const authenticateRoom = (req, res, next) => {
  const user = verify(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const room = String(req.query.room || req.params.slug || '').trim();
  if (!user || user.nickName !== req.user?.nickName || user.room !== room || user.access !== true) {
    return res.status(403).json({ error: 'Acesso à sala não autorizado' });
  }
  req.roomUser = user;
  return next();
};

module.exports = { sign, verify, hashPassword, checkPassword, authenticate, authenticateRoom };