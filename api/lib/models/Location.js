import * as Chance                       from 'chance';
import * as squel                        from 'squel';
import assets                            from '../assets/schemas/load-schemas';
import BaseObject                        from './BaseObject';
import { TABLE_NAME as eventsTableName } from './event/event';

const locationSchema = assets('locationSchema');

const chance = new Chance();

export const TABLE_NAME = 'LOCATIONS';

export class Location extends BaseObject {

  get schema() {
    return locationSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  protected get id() {
    return this.uid;
  }

  public static generateTestData(uow) {
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
  public static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  /**
   * This query selects locations that are "relevant" to the
   * timestamp parameter
   * The query selects locations based on events that match the timestamp
   * based on the following conditions:
   * 1) The event has started or is starting within 30 minutes
   * 2) The event has not ended or ended within the last 30 minutes
   */
  public static getActiveLocations(uow, timestamp = Date.now()) {
    const BUFFER_TIME = 30 * 60 * 1000;
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TABLE_NAME, 'locations')
      .field('locations.*')
      .join(eventsTableName, 'events', 'locations.uid = events.event_location')
      .where('events.event_start_time <= ?', timestamp + BUFFER_TIME)
      .where('events.event_end_time >= ?', timestamp - BUFFER_TIME)
      .group('locations.uid')
      .toParam();
    return uow.query(query.text, query.values, { stream: true, cache: true });
  }

  public static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }
  private uid: string;
  private location_name: string;

  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid;
    this.location_name = data.locationName || '';
  }
}
