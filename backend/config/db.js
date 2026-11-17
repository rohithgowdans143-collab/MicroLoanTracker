const dns = require('dns');

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);
const mongoose = require('mongoose');
const models = require('../models/mongoModels');

const toRecord = document => {
  if (!document) return null;
  const record = document.toObject ? document.toObject() : document;
  delete record._id;
  return record;
};

const db = {
  async connect() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/microloan_tracker';
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB database "${mongoose.connection.name}".`);
  },

  async find(collection, filterFn = null) {
    const records = (await models[collection].find({}).lean()).map(toRecord);
    return filterFn ? records.filter(filterFn) : records;
  },

  async findOne(collection, filterFn) {
    const records = await models[collection].find({}).lean();
    const match = records.find(filterFn);
    return toRecord(match);
  },

  async insert(collection, item) {
    const record = {
      id: item.id || `${collection.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    const [saved] = await models[collection].create([record]);
    return toRecord(saved);
  },

  async update(collection, filterFn, updates) {
    const records = await models[collection].find({}).lean();
    const match = records.find(filterFn);
    if (!match) return null;

    const updated = await models[collection].findOneAndUpdate(
      { _id: match._id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { new: true, lean: true, runValidators: true }
    );
    return toRecord(updated);
  },

  async delete(collection, filterFn) {
    const records = await models[collection].find({}).lean();
    const matchingIds = records.filter(filterFn).map(record => record._id);
    if (!matchingIds.length) return false;
    await models[collection].deleteMany({ _id: { $in: matchingIds } });
    return true;
  },

  async clear(collection) {
    await models[collection].deleteMany({});
  }
};

module.exports = db;
