import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Event } from '../../../src/models/event/event';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';

let listener: firebase.Unsubscribe;
let firebaseUser: firebase.User;

function login(email: string, password: string): Promise<firebase.User> {
  if (firebaseUser) {
    return new Promise(resolve => resolve(firebaseUser));
  }
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          firebaseUser = user;
          resolve(user);
        }
      });
  });
}

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Live Events')
class LiveEventsIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/live/events';
  protected readonly tableName = 'EVENTS';
  protected readonly pkColumnName = 'uid';

  @test('successfully creates a new event')
  @slow(1500)
  public async createEventSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: 'Test uid',
      eventLocation: TestData.validLocation().uid,
      eventStartTime: 1,
      eventEndTime: 2,
      eventTitle: 'Test event',
      eventDescription: 'This is a long test description',
      eventType: 'workshop',

    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The inserted event is checked
    await this.verifyEvent(res.body.body.data);
  }

  @test('successfully updates an event')
  @slow(1500)
  public async updateEventSuccessfully() {
    // GIVEN: API
    // WHEN: Updating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: 'test event uid',
      eventLocation: TestData.validLocation().uid,
      eventStartTime: 100,
      eventEndTime: 200,
      eventTitle: 'Test Event',
      eventDescription: 'This is a long test description updated',
      eventType: 'workshop',
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Event is checked
    await this.verifyEvent(res.body.body.data);
  }

  @test('successfully gets events')
  @slow(1500)
  public async getEventsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the events
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Events are checked
    await this.verifyEvents(res.body.body.data);
  }

  @test('successfully removes an event')
  @slow(1500)
  public async deleteEventSuccessfully() {
    // GIVEN: API
    // WHEN: Removing an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { uid: 'Test uid' };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
  }

  @test('fails to create an event when no location is provided')
  @slow(1500)
  public async createEventFailsDueToNoLocation() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {};
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event location must be provided' });
  }

  @test('fails to create an event when no start time is provided')
  @slow(1500)
  public async createEventFailsDueToNoStartTime() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { eventLocation: 998 };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event start time must be provided' });
  }

  @test('fails to create an event when no end time is provided')
  @slow(1500)
  public async createEventFailsDueToNoEndTime() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      eventLocation: 998,
      eventStartTime: 100,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event end time must be provided' });
  }

  @test('fails to create an event when no title is provided')
  @slow(1500)
  public async createEventFailsDueToNoTitle() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      eventLocation: 998,
      eventStartTime: 100,
      eventEndTime: 200,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event title must be provided' });
  }

  @test('fails to create an event when no description is provided')
  @slow(1500)
  public async createEventFailsDueToNoDescription() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      eventLocation: 998,
      eventStartTime: 100,
      eventEndTime: 200,
      eventTitle: 'Test title',
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event description must be provided' });
  }

  @test('fails to create an event when no event type is provided')
  @slow(1500)
  public async createEventFailsDueToNoEventType() {
    // GIVEN: API
    // WHEN: Creating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      eventLocation: 998,
      eventStartTime: 100,
      eventEndTime: 200,
      eventTitle: 'Test title',
      eventDescription: 'Test description',
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event type must be provided' });
  }

  @test('fails to update an event when no event uid is provided')
  @slow(1500)
  public async updateEventFailsDueToNoEvent() {
    // GIVEN: API
    // WHEN: Updating an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event uid must be provided' });
  }

  @test('fails to delete an event when no event ID is provided')
  @slow(1500)
  public async deleteEventFailsDueToNoId() {
    // GIVEN: API
    // WHEN: Deleting an event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {};
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Event uid must be provided' });
  }

  private async verifyEvent(event: Event) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'events')
      .where(`${this.pkColumnName} = ?`, event.uid)
      .toParam();
    query.text = query.text.concat(';');

    const result = await LiveEventsIntegrationTest.mysqlUow.query<Event>(
      query.text,
      query.values,
    ) as Event[];
    delete result[0].hackathon;
    result[0].event_start_time = parseInt(result[0].event_start_time as any as string, 10);
    result[0].event_end_time = parseInt(result[0].event_end_time as any as string, 10);
    this.expect(event).to.deep.equal(result[0]);
  }

  private async verifyEvents(events: Event[]) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName, 'event')
      .field('event.*')
      .field('location.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'location', 'event_location=location.uid')
      .join('HACKATHON', 'h', 'h.uid = event.hackathon')
      .where('h.uid = ?', LiveEventsIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');

    const result = await LiveEventsIntegrationTest.mysqlUow.query<Event>(
      query.text,
      query.values,
    ) as Event[];
    result.forEach((event) => {
      event.event_start_time = parseInt(event.event_start_time as any as string, 10);
      event.event_end_time = parseInt(event.event_end_time as any as string, 10);
    });
    this.expect(events).to.deep.equal(result);
  }
}