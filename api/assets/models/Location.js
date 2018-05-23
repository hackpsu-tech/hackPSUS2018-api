const BaseObject = require('./BaseObject');
const Chance = require('chance');

const chance = new Chance(123);
const { locationSchema } = require('../helpers/schemas');

const TABLE_NAME = 'LOCATIONS';
module.exports = TABLE_NAME;

module.exports = class Location extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, locationSchema, TABLE_NAME);
    this.uid = data.uid || null;
    this.location_name = data.location_name || '';
  }

  static generateTestData(uow) {
    const testObj = new Location({}, uow);
    testObj.location_name = chance.string();
    return testObj;
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }
};