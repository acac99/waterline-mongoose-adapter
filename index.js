const { Types } = require('mongoose');
const FindQueryBuilder = require('./FindQueryBuilder');
const MongooseAdapter = require('./MongooseAdapter');
const LeanObjectIdToStringPlugin = require('./LeanObjectIdToStringPlugin');

const findQueryBuilder = FindQueryBuilder();
const mongooseAdapter = MongooseAdapter({
  ObjectId: Types.ObjectId,
  findQueryBuilder
});

module.exports = {
  WaterlineMongooseAdapter: mongooseAdapter,
  LeanObjectIdToStringPlugin
};
