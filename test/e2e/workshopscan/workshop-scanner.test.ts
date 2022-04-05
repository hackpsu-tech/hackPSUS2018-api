import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Registration } from '../../../src/models/register/registration';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';
import { WorkshopScan } from '../../../src/models/workshops-scans/workshop-scans';

@suite('INTEGRATION TEST: WorkshopScan')
class WorkshopScanIntegrationTest extends IntegrationTest {

    public static async before() {
      await IntegrationTest.before();
    }
  
    public static async after() {
      await IntegrationTest.after();
    }

    protected readonly apiEndpoint = '/v2/workshop';
    protected readonly tableName = 'WORKSHOP_SCANS';
    protected readonly pkColumnName = 'scan_uid';
    private pin: string;
    @test('obtains the registration associated with the given pin')
    @slow(1500)
    public async getRegistrationSuccessfully() {
        // GIVEN: API
        // WHEN: Getting a registration by pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        // console.log(idToken);
        const parameters = {pin: TestData.insertedUserPin()};
        const res = await this.chai
          .request(this.app)
          .get(`${this.apiEndpoint}/user`)
          .set('idToken', idToken)
          .set('content-type', 'application/json')
          .query(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res);
        // THEN: The response is checked
        await this.verifyRegistration(res.body.body.data);
    }

    @test('fails to get a registration when no pin is provided')
    @slow(1500)
    public async getRegistrationFailsDueToNoPin() {
        // GIVEN: API
        // WHEN: Getting a registration by pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const res = await this.chai
        .request(this.app)
        .get(`${this.apiEndpoint}/user`)
        .set('idToken', idToken)
        .set('content-type', 'application/json');
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find pin to query by' });
    }

    @test('fails to get a registration when invalid pin is provided')
    @slow(1500)
    public async getRegistrationFailsDueToInvalidPin() {
        // GIVEN: API
        // WHEN: Getting a registration by pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = {pin: 'asdfasdf'};
        const res = await this.chai
        .request(this.app)
        .get(`${this.apiEndpoint}/user`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .query(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find pin to query by' });
    }

    @test('creates new workshop scan instance')
    public async scanWorkshopSuccessfully(){
        //GIVEN: API
        //WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const parameters = {pin: 5, eventUid: 'test event uid'};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res);
        // THEN: The response is checked
        await this.verifyWorkshopScan(res.body.body.data);
    }

    @test('fails to create a new workshop scan instance when no pin is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToNoPin() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = {event_id: 'test event uid'};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid pin' });
    }

    @test('fails to create a new workshop scan instance when invalid pin is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToInvalidPin() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = {pin: 'asdfasdf', event_id: 'test event uid'};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid pin' });
    }

    @test('fails to create a new workshop scan instance when no event uid is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToNoEventUid() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = {pin: TestData.insertedUserPin()};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid event uid' });
    }

    @test('fails to create a new workshop scan instance when invalid event uid is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToInvalidEventUid() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const parameters = {pin: 5, event_id: 'invalid id'};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid event uid' });
    }


    private async verifyWorkshopScan(object: WorkshopScan) {
        const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
          .from(TestData.workshopScansTableName)
          .where('user_pin = ?', 5)
          .where('event_id = ?', 'test event uid')
          .toParam();
        const [result] = await WorkshopScanIntegrationTest.mysqlUow.query<WorkshopScan>(
        query.text,
        query.values,
        ) as WorkshopScan[];
        
        // remove properties that we didn't send
        delete result.hackathon_id;
        delete result.scan_uid;
        delete result.timestamp;
        delete object.timestamp;

        this.expect(result).to.deep.equal(object);
    }

    private async verifyRegistration(registration: Registration) {
        const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(TestData.registerTableName, 'register')
            .where('pin = ?', TestData.insertedUserPin())
            .toParam();
        const [result] = await WorkshopScanIntegrationTest.mysqlUow.query<Registration>(
            query.text,
            query.values,
        ) as Registration[];
        this.expect(result).to.deep.equal(registration);
    }
}