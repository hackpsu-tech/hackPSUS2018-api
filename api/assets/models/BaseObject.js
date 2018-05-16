/* eslint-disable no-underscore-dangle,no-param-reassign */

const squel = require('squel');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });


/**
 *
 * @type {module.BaseObject}
 */
module.exports = class BaseObject {
  /**
   *
   * @param uow {MysqlUow}
   * @param schema
   * @param tableName
   */
  constructor(uow, schema, tableName) {
    if (Object.getPrototypeOf(this) === BaseObject.prototype) {
      throw new Error('BaseObject is abstract and cannot be instantiated');
    }
    this.uow = uow;
    this.schema = schema;
    this.tableName = tableName;
  }

  /**
   * Returns a representation of the object that can be added directly to the database
   * For any subclass that contains properties that do not get added to the db,
   * ensure that this method is overridden and calls super._dbRepresentation()
   * @return {{}}
   * @private
   */
  _dbRepresentation() {
    return Object.entries(this)
      .filter(kv => !'uowschematableName'.includes(kv[0])) // hacky
      .reduce((accumulator, currentValue) => {
        accumulator[currentValue[0]] = currentValue[1];
        return accumulator;
      }, {});
  }

  /**
   * Validates that the object matches some ajv schema
   * @return {{result: boolean | ajv.Thenable<any>, error: *}}
   */
  validate() {
    const validate = ajv.compile(this.schema);
    const result = validate(this);
    return { result, error: result ? null : ajv.errorsText(validate.errors) };
  }

  /**
   * Returns all or certain number of objects as a stream
   * @param uow
   * @param tableName
   * @param opts {{}} opts.fields: fields to include :: opts.startAt: object number to start at ::
   * opts.count: how many objects to return
   * @return {Promise<Stream>}
   */
  static getAll(uow, tableName, opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .offset((opts && opts.startAt) || null)
      .limit((opts && opts.count) || null)
      .toString()
      .concat(';');
    const params = [];
    return uow.query(query, params, { stream: true });
  }

  /**
   * Returns one object as noted by parameter uid
   * @param uid {String} uid of object
   * @param opts {{}} opts.fields: fields to include
   * @return {Promise<Stream>}
   */
  get(uid, opts) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values, { stream: true });
  }

  /**
   * Adds a new object to the appropriate table
   * @return {Promise<any>}
   */
  add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation()])
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  /**
   * Updates the object in the database
   * @return {Promise<any>}
   */
  update() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(this._dbRepresentation())
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  /**
   * Deletes the object from the database
   * @param uid
   * @return {Promise<any>}
   */
  delete(uid) {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }
};
