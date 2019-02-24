const express = require('express');
const { streamHandler, errorHandler500 } = require('../../services/functions');
const { CheckoutObject } = require('../../../models/CheckoutObject');
const { CheckoutItem } = require('../../../models/CheckoutItem');
const { verifyACL } = require('../../../services/auth/firebase-auth');
const HttpError = require('../../../JSCommon/errors');

const router = express.Router();

/** *********** HELPER FUNCTIONS ************* */

/** *********** ROUTING MIDDLEWARE *********** */

/** ***************** ROUTES ***************** */

// router.post('/', verifyACL(2), (req, res, next) => {
//   if (!req.body || !req.body.itemId || !req.body.userId) {
//     const error = new HttpError('Incorrectly formatted body', 400);
//     return next(error);
//   }
//   const checkoutInstance = new CheckoutObject(
//     Object.assign(
//       req.body,
//       { checkoutTime: new Date().getTime() },
//     ),
//     req.uow,
//   );
//   return checkoutInstance
//     .add()
//     .then(() => res.status(200).send({ message: 'Success' }))
//     .catch((err) => {
//       const error = new Error();
//       error.status = err.status || 500;
//       error.body = err.message || err;
//       return next(error);
//     });
// });


// router.post('/return', verifyACL(2), (req, res, next) => {
//   if (!req.body || !req.body.checkoutId) {
//     const error = new HttpError('Incorrectly formatted body', 400);
//     return next(error);
//   }
//   const checkoutInstance = new CheckoutObject(
//     {
//       uid: req.body.checkoutId,
//       returnTime: new Date().getTime(),
//     },
//     req.uow,
//   );
//   return checkoutInstance
//     .returnItem()
//     .then(() => res.status(200).send({ message: 'Success' }))
//     .catch((err) => {
//       const error = new Error();
//       error.status = err.status || 500;
//       error.body = err.message || err;
//       return next(error);
//     });
// });

// router.get('/', verifyACL(2), (req, res, next) => {
//   CheckoutObject.getAll(req.uow, {
//     count: res.locals.limit,
//     startAt: res.locals.offset,
//     currentHackathon: true,
//   })
//     .then(stream => streamHandler(stream, res, next))
//     .catch(err => errorHandler500(err, next));
// });

// router.get('/items', verifyACL(2), (req, res, next) => {
//   CheckoutItem.getAll(req.uow, {
//     count: res.locals.limit,
//     startAt: res.locals.offset,
//   })
//     .then(stream => streamHandler(stream, res, next))
//     .catch(err => errorHandler500(err, next));
// });

// /**
//  * @api {post} /firebase/checkout/items Add new item for checkout
//  * @apiVersion 1.0.0
//  * @apiName Add new item for checkout
//  * @apiGroup Item Checkout
//  * @apiParam {String} name Name of the item
//  * @apiParam {Number} quantity Quantity of items available
//  * @apiUse AuthArgumentRequired
//  * @apiPermission DirectorPermission
//  * @apiSuccess {String} Success
//  * @apiUse IllegalArgumentError
//  */
// router.post('/items', verifyACL(3), (req, res, next) => {
//   if (!req.body || !req.name || !req.quantity) {
//     const error = new HttpError('Incorrectly formatted body', 400);
//     return next(error);
//   }
//   const item = new CheckoutItem(req.body, req.uow);
//   return item.add()
//     .then(() => res.status(200).send({ message: 'Success' }))
//     .catch((err) => {
//       const error = new Error();
//       error.status = err.status || 500;
//       error.body = err.message || err;
//       return next(error);
//     });
// });

// /**
//  * @api {get} /firebase/checkout/items/availability Get availability for items
//  * @apiVersion 1.0.0
//  * @apiName Get availability for checkout items
//  * @apiGroup Item Checkout
//  * @apiUse AuthArgumentRequired
//  * @apiPermission TeamMemberPermission
//  *
//  * @apiSuccess {String} Success
//  * @apiUse IllegalArgumentError
//  */
// router.get('/items/availability', verifyACL(2), (req, res, next) => CheckoutItem.getAllAvailable(req.uow)
//   .then(stream => streamHandler(stream, res, next))
//   .catch(err => errorHandler500(err, next)));

// module.exports = router;
