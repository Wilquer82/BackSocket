const connection = require('./connection');

const collection = () => connection().then((db) => db.collection('rooms'));
const publicRoom = ({ passwordHash, ...room }) => room;
const createRoom = async (room) => (await collection()).insertOne({ ...room, blocked: false, createdAt: new Date() });
const findRoom = async (slug) => (await collection()).findOne({ slug });
const listRooms = async () => (await collection()).find({ hidden: { $ne: true }, blocked: false }).project({ passwordHash: 0 }).sort({ createdAt: -1 }).toArray();
const updateRoom = async (slug, update) => (await collection()).updateOne({ slug }, { $set: update });

module.exports = { createRoom, findRoom, listRooms, updateRoom, publicRoom };