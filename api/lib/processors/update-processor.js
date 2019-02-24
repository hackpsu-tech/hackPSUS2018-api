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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const router_types_1 = require("../router/router-types");
const logging_1 = require("../services/logging/logging");
let UpdateProcessor = class UpdateProcessor {
    constructor(updateDataMapper, notificationService, logger) {
        this.updateDataMapper = updateDataMapper;
        this.notificationService = notificationService;
        this.logger = logger;
    }
    processUpdate(update) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.updateDataMapper.insert(update);
            // Send out push notification and pass along stream
            if (update.push_notification) {
                try {
                    yield this.notificationService.sendNotification(update.update_title, update.update_text);
                }
                catch (error) {
                    this.logger.error(error);
                }
            }
            return new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: result });
        });
    }
};
UpdateProcessor = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IUpdateDataMapper')),
    __param(1, injection_js_1.Inject('IPushNotifService')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, logging_1.Logger])
], UpdateProcessor);
exports.UpdateProcessor = UpdateProcessor;
//# sourceMappingURL=update-processor.js.map