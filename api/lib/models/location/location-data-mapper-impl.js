"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel = __importStar(require("squel"));
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../services/logging/logging");
let LocationDataMapperImpl = class LocationDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, logger) {
        super(acl);
        this.sql = sql;
        this.logger = logger;
        // ACL permissions
        this.CREATE = 'location:create';
        this.DELETE = 'location:delete';
        this.READ = 'location:read';
        this.UPDATE = 'location:update';
        this.READ_ALL = 'location:readall';
        this.COUNT = 'location:count';
        this.tableName = 'LOCATIONS';
        this.pkColumnName = 'uid';
        super.addRBAC([this.CREATE, this.UPDATE, this.DELETE], [auth_types_1.AuthLevel.TEAM_MEMBER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.VOLUNTEER]]);
        super.addRBAC([this.READ, this.READ_ALL], [auth_types_1.AuthLevel.PARTICIPANT]);
    }
    delete(id) {
        const query = squel
            .delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName)
            .where(`${this.pkColumnName} = ?`, id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false }))
            .pipe(operators_1.map(() => ({ result: 'Success', data: undefined })))
            .toPromise();
    }
    get(id, opts) {
        let queryBuilder = squel
            .select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(this.tableName);
        if (opts && opts.fields) {
            queryBuilder = queryBuilder.fields(opts.fields);
        }
        queryBuilder = queryBuilder.where(`${this.pkColumnName}= ?`, id);
        const query = queryBuilder.toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, {
            cache: true,
        }))
            .pipe(operators_1.map((location) => ({ result: 'Success', data: location[0] })))
            .toPromise();
    }
    getAll() {
        const query = squel
            .select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName, 'location')
            .toString()
            .concat(';');
        const params = [];
        return rxjs_1.from(this.sql.query(query, params, { cache: true }))
            .pipe(operators_1.map((locations) => ({
            data: locations,
            result: 'Success',
        })))
            .toPromise();
    }
    getCount() {
        const query = squel
            .select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
            .from(this.tableName)
            .field(`COUNT(${this.pkColumnName})`, 'count')
            .toString()
            .concat(';');
        const params = [];
        return rxjs_1.from(this.sql.query(query, params, { cache: true }))
            .pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] })))
            .toPromise();
    }
    insert(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({
                data: new errors_1.HttpError(validation.error, 400),
                result: 'error',
            });
        }
        const query = squel
            .insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .into(this.tableName)
            .setFieldsRows([object.dbRepresentation])
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, {
            cache: false,
        }))
            .pipe(operators_1.map(() => ({ result: 'Success', data: object })))
            .toPromise();
    }
    update(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({
                data: new errors_1.HttpError(validation.error, 400),
                result: 'error',
            });
        }
        const query = squel
            .update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .table(this.tableName)
            .setFields(object.dbRepresentation)
            .where(`${this.pkColumnName} = ?`, object.id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, {
            cache: false,
        }))
            .pipe(operators_1.map(() => ({ result: 'Success', data: object })))
            .toPromise();
    }
};
LocationDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow,
        logging_1.Logger])
], LocationDataMapperImpl);
exports.LocationDataMapperImpl = LocationDataMapperImpl;
//# sourceMappingURL=location-data-mapper-impl.js.map