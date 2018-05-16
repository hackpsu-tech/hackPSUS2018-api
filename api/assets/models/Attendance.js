/* eslint-disable class-methods-use-this */
const BaseObject = require('./BaseObject');

const TABLE_NAME = 'ATTENDANCE';

module.exports = class Attendance extends BaseObject {
  constructor(data, uow) {
    super(uow, null, TABLE_NAME);
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

  add() {
    throw new Error('This method is not supported by this class');
  }

  update() {
    throw new Error('This method is not supported by this class');
  }

  delete() {
    throw new Error('This method is not supported by this class');
  }
};
