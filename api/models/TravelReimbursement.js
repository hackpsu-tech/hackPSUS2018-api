const uuidv4 = require('uuid/v4');
const BaseObject = require('./BaseObject');
const travelReimbursementSchema = require('../assets/schemas/load-schemas')('travelReimbursementSchema');

const TABLE_NAME = 'TRAVEL_REIMBURSEMENT';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.TravelReimbursement = class TravelReimbursement extends BaseObject {
  constructor(data, uow) {
    super(uow, travelReimbursementSchema, TABLE_NAME);
    this.fullname = data.fullName || null;
    this.reimbursement_amount = data.reimbursementAmount || 0;
    this.mailing_address = data.mailingAddress || null;
    this.group_members = data.groupMembers || null;
    this.user_id = data.uid || null;
    this.receipt_uris = data.receiptURIs || null;
    this.uid = data.uid || uuidv4().replace(/-/g, '');
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  static generateTestData() {
    throw new Error('Not implemented');
  }

  get schema() {
    return travelReimbursementSchema;
  }
};
