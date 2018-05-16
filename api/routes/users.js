/* eslint-disable consistent-return,no-use-before-define,no-param-reassign,max-len */
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');
const path = require('path');
const Ajv = require('ajv');

const functions = require('../assets/helpers/functions');
const authenticator = require('../assets/helpers/auth');
const database = require('../assets/helpers/database/database');
const constants = require('../assets/helpers/constants');
const TravelReimbursement = require('../assets/models/TravelReimbursement');
const { projectRegistrationSchema, travelReimbursementSchema } = require('../assets/helpers/schemas');
const Registration = require('../assets/models/Registration');
const Project = require('../assets/models/Project');
const RSVP = require('../assets/models/RSVP');
const Category = require('../assets/models/Category');

const router = express.Router();


const ajv = new Ajv({ allErrors: true });


aws.config.update({
  accessKeyId: constants.s3Connection.accessKeyId,
  secretAccessKey: constants.s3Connection.secretAccessKey,
  region: constants.s3Connection.region,
});


const s3 = new aws.S3();

const storage = multers3({
  s3,
  bucket: constants.s3Connection.s3TravelReimbursementBucket,
  acl: 'public-read',
  serverSideEncryption: 'AES256',
  metadata(req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
    });
  },
  key(req, file, cb) {
    cb(null, generateFileName(req.body.fullName, file));
  },
});

function generateFileName(fullName, file) {
  return `${fullName}-receipt-${file.originalname}`;
}

const upload = multer({
  fileFilter(req, file, cb) {
    if (path.extname(file.originalname) !== '.jpeg' && path.extname(file.originalname) !== '.png' && path.extname(file.originalname) !== '.jpg') {
      return cb(new Error('Only jpeg, jpg, and png are allowed'));
    }
    cb(null, true);
  },
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // limit to 5MB
});

/** *********** HELPER FUNCTIONS ************* */

function validateProjectRegistration(project) {
  const validate = ajv.compile(projectRegistrationSchema);
  if (process.env.NODE_ENV === 'test') {
    validate(project);
    console.error(validate.errors);
  }
  return !!validate(project);
}

/**
 *
 * @param data
 */
function validateReimbursement(data) {
  const validate = ajv.compile(travelReimbursementSchema);
  const result = !!validate(data);
  console.error(validate.errors);
  return result;
}

/**
 *
 * @param price {Number}
 * @param groupMembers {String}
 */
function adjustReimbursementPrice(price, groupMembers) {
  if ((groupMembers === '1' || groupMembers === '0') && price > 50) {
    return 50;
  } else if (groupMembers === '2' && price > 60) {
    return 60;
  } else if (groupMembers === '3' && price > 70) {
    return 70;
  } else if (price > 70) {
    return 70;
  }

  return price;
}

String.prototype.padStart = String.prototype.padStart ?
  String.prototype.padStart :
  function (targetLength, padString) {
    targetLength = Math.floor(targetLength) || 0;
    if (targetLength < this.length) return String(this);

    padString = padString ? String(padString) : ' ';

    let pad = '';
    const len = targetLength - this.length;
    let i = 0;
    while (pad.length < len) {
      if (!padString[i]) {
        i = 0;
      }
      pad += padString[i];
      i++;
    }

    return pad + String(this).slice(0);
  };

/** *********** HELPER MIDDLEWARE ***************** */
/**
 * User authentication middleware
 */
router.use((req, res, next) => {
  if (req.headers.idtoken) {
    authenticator.checkAuthentication(req.headers.idtoken)
      .then((decodedToken) => {
        res.locals.user = decodedToken;
        res.locals.uid = decodedToken.uid;
        next();
      }).catch((err) => {
        const error = new Error();
        error.status = 401;
        error.body = err.message;
        next(error);
      });
  } else {
    const error = new Error();
    error.status = 401;
    error.body = { error: 'ID Token must be provided' };
    next(error);
  }
});


/** *********** ROUTING MIDDLEWARE *********** */
/**
 * @api {get} /users Get the privilege information for the current user
 * @apiVersion 0.1.2
 * @apiName Get user privilege information
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/', (req, res, next) => {
  if (res.locals.user) {
    res.status(200).send({ admin: res.locals.user.admin, privilege: res.locals.user.privilege });
  } else {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    next(error);
  }
});

/**
 * @api {get} /users/registration Get the registration information for the current user
 * @apiVersion 0.2.1
 * @apiName Get user registration information
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/registration', (req, res, next) => {
  if (res.locals.user) {
    new Registration({ uid: res.locals.users.uid })
      .get()
      .then((stream) => {
        stream
          .pipe(res)
          .on('err', (err) => {
            const error = new Error();
            error.status = 500;
            error.body = err.message;
            next(error);
          }).on('end', () => {
            res.status(200).send();
          });
      });
  } else {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    next(error);
  }
});

/**
 * @api {get} /users/project Get the project details and table assignment for the current user
 * @apiVersion 0.4.0
 * @apiName Get user project data
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's table assignment data
 */
router.get('/project', (req, res, next) => {
  if (res.locals.user) {
    const info = [];
    Project.getByUser(res.locals.user.uid, req.uow)
      .then((stream) => {
        stream
          .on('data', (data) => {
            // Due to stream nature, data may be partial array or full array of responses
            info.push(data);
          }).on('err', (err) => {
            const error = new Error();
            error.status = 500;
            error.body = err.message;
            next(error);
          }).on('end', () => {
          // Reduce the large number of responses that differ by
          // category name and id into a json array internally instead
            const rJSON = info.reduce((accumulator, currentVal) => {
              Object.keys(currentVal).forEach((k) => {
                if (k !== 'categoryName' && k !== 'categoryID') { // If the field is going to be the same
                  accumulator[k] = currentVal[k];
                } else if (accumulator[k]) { // Else accumulate it in an array
                  accumulator[k].push(currentVal[k]);
                } else {
                  accumulator[k] = [currentVal[k]];
                }
              });
              return accumulator;
            }, {});
            res.status(200).send(rJSON);
          });
      });
  } else {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    next(error);
  }
});
/**
 * @api {post} /users/rsvp confirm the RSVP status for the current user and send a email containing their pin
 * @apiVersion 0.1.1
 * @apiName Set RSVP
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiParam {String} A value to indicate if the user decide to rsvp ['true', 'false']
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess sends a email with user's pin
 * @apiUse IllegalArgumentError
 */
router.post('/rsvp', (req, res, next) => {
  if (req.body && (typeof req.body.rsvp !== 'undefined')) {
    if (res.locals.user) {
      database.setRSVP(res.locals.user.uid, req.body.rsvp === 'true')
        .then(() => {
          if (req.body.rsvp === 'true') {
            let user = null;
            new Registration({ data: res.locals.user.uid })
              .then((stream) => {
                stream
                  .on('data', (data) => {
                    user = data;
                  }).on('err', (err) => { // Database registration retrieval
                    const error = new Error();
                    error.status = 500;
                    error.body = err.message;
                    console.error(error);
                    next(error);
                  }).on('end', () => {
                    const { email } = user;
                    const name = user.firstname;
                    const pin = user.pin || 78;
                    functions.emailSubstitute(constants.RSVPEmailHtml.text, name, {
                      name,
                      pin: parseInt(pin, 10).toString(14).padStart(3, '0'),
                    })
                      .then((subbedHTML) => {
                        const request = functions.createEmailRequest(email, subbedHTML, constants.RSVPEmailHtml.subject, '');
                        functions.sendEmail(request.data)
                          .then(() => {
                            res.status(200).send({
                              message: 'success',
                              pin: parseInt(pin, 10).toString(14).padStart(3, '0'),
                            });
                          // resolve({'email': request.data.to, 'html': request.data.htmlContent, 'response': 'success'});
                          })
                          .catch((err) => { // Send Email error
                            const error = new Error();
                            error.status = 500;
                            error.body = err.message;
                            console.error(error);
                            next(error);
                          });
                      }).catch((err) => { // Email Substitute error
                        const error = new Error();
                        error.status = 500;
                        error.body = err.message;
                        console.error(error);
                        next(error);
                      });
                  });
              });
          } else {
            res.status(200).send({ message: 'success' });
          }
        }).catch((err) => { // Set RSVP error
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          console.error(error);
          next(error);
        });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = { error: 'Could not identify user' };
      console.error(error);
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'RSVP value must be included' };
    next(error);
  }
});


/**
 * @api {get} /users/rsvp Get the RSVP status for a user
 * @apiVersion 0.1.1
 * @apiName get RSVP status
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Object} Containing the rsvp status based on the uid
 * @apiUse IllegalArgumentError
 */
router.get('/rsvp', (req, res, next) => {
  if (res.locals.user) {
    new RSVP({ uid: res.locals.user.uid })
      .get()
      .then((status) => {
        res.status(200).send(status || { rsvp_status: false });
      }).catch((err) => {
        const error = new Error();
        error.status = err.status || 500;
        error.body = error.message;
        next(error);
      });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Could not identify user' };
    next(error);
  }
});


/**
 * @api {post} /users/travelReimbursement submit travel reimbursement information
 * @apiVersion 0.2.2
 * @apiName Travel Reimbursement
 * @apiGroup users
 * @apiUse AuthArgumentRequired
 * @apiParam {String} fullName first and last names of the user as they would appear on a check.
 * @apiParam {Number} reimbursementAmount the total amount of money they are requesting, as appears on their receipts
 * @apiParam {String} mailingAddress the full postal address of the user
 * @apiParam {enum} groupMembers ["1", "2", "3", "4+"]
 * @apiParam {FILE} [receipt] The receipt files for this user, users can send up to 5 files all under fieldname receipt. (Max size: 5 MB each)
 * @apiPermission valid user credentials
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/travelreimbursement', upload.array('receipt', 5), (req, res, next) => {
  if (parseInt(req.body.reimbursementAmount, 10)) {
    req.body.reimbursementAmount = parseInt(req.body.reimbursementAmount, 10);
    if (!(req.body && validateReimbursement(req.body))) {
      const error = new Error();
      error.body = { error: 'Request body must be set and be valid' };
      error.status = 400;
      next(error);
    } else {
      req.body.reimbursementAmount = adjustReimbursementPrice(req.body.reimbursementAmount, req.body.groupMembers);
      req.body.receiptURIs = req.files.map(file => `https://s3.${
        constants.s3Connection.region
      }.amazonaws.com/${
        constants.s3Connection.s3TravelReimbursementBucket
      }/${
        file.key}`).join(',');
      new TravelReimbursement(Object.assign(req.body, { uid: res.locals.user.uid }))
        .add()
        .then(() => {
          res.status(200).send({
            result: `Travel reimbursement request submitted. Final amount: $${
              req.body.reimbursementAmount
            }. This amount is based on the number of people in your party.`,
          });
        }).catch((error) => {
          error.status = 500;
          next(error);
        });
    }
  } else {
    const error = new Error();
    error.body = { error: 'Reimbursement amount must be a number' };
    error.status = 400;
    next(error);
  }
});

/**
 * @api {post} /users/project Post the project details to get the table assignment
 * @apiVersion 0.4.0
 * @apiName Post user project data
 * @apiGroup Users
 * @apiPermission User
 * @apiParam {String} projectName Name of the project
 * @apiParam {Array} team Array of team emails
 * @apiParam {Array} categories Array of category IDs the project is submitting for

 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's project ID
 */
router.post('/project', (req, res, next) => {
  /*
  1) insert project
  2) insert members
  3) insert project categories
  4) get project id
   */
  if (res.locals.user) {
    // User is present
    /** ***************************** */

    // Check for data format
    if (validateProjectRegistration(req.body)) {
      // Valid project
      const uidPromises = req.body.team.map(email => authenticator.getUserId(email));
      Promise.all(uidPromises)
        .then((records) => {
          const uids = records.map(r => r.uid);
          // uids contains an array of uids
          if (!uids.includes(res.locals.user.uid)) {
            uids.push(res.locals.user.uid);
          }
          const { categories } = req.body;
          if (categories && Array.isArray(categories) && categories.length === categories.filter(value => value.match(/\d+/)).length) {
            // Categories array is valid
            const project = new Project({ projectName: req.body.projectName, team: uids, categories })
              .add()
              .then((result) => {
                if (process.env.NODE_ENV === 'test') {
                  console.log(result);
                }
                // Project ID returned here.
                // Assign a table now
                project.assignTable()
                  .then((result1) => {
                    res.status(200).send(result1);
                  }).catch((err) => {
                    const error = new Error();
                    error.status = 500;
                    error.body = err.message;
                    next(error);
                  });
              }).catch((err) => {
                const error = new Error();
                error.status = 500;
                error.body = err.message;
                next(error);
              });
          } else {
            const error = new Error();
            error.body = { result: 'Some categories were not valid. Check and try again' };
            error.status = 400;
            next(error);
          }
        }).catch((err) => {
          const error = new Error();
          error.status = 400;
          error.body = {
            result: 'Some emails were not associated with an account. Please check your input and try again.',
            info: err.message,
          };
          next(error);
        });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {
        result: 'Some properties were not as expected. Make sure you provide a list of team members and categories',
      };
      next(error);
    }
  }
});
/**
 * @api {get} /user/event_categories Get all the event categories
 * @apiName Get Event Categories
 * @apiVersion 0.3.2
 * @apiGroup User
 * @apiPermission Authenticated
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Array} Categories
 */
router.get('/event_categories', (req, res, next) => {
  Category.getAll()
    .then((stream) => {
      stream.pipe(res);
      stream.on('err', () => {
        const error = new Error();
        error.status = 500;
        error.body = { error: 'Could not retrieve category information' };
        next(error);
      }).on('end', () => {
        res.status(200).send();
      });
    });
});


module.exports = router;
