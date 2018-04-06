const admin = require('firebase-admin');

/**
 * Checks if the provided token is authenticated
 * @param idToken
 * @return {Promise<admin.auth.DecodedIdToken>}
 */
function checkAuthentication(idToken) {
    return admin.auth().verifyIdToken(idToken);
}

/**
 * Makes the provided UID an administrator with the provided provilege level
 * @param uid
 * @param privilege
 * @return {Promise<any>}
 */
function elevate(uid, privilege) {
    return admin.auth().setCustomUserClaims(uid, { admin: true, privilege });
}

/**
* Retreive the userID base on the email provided
*	@param email
*	@return Promise{admin.auth.UserRecord}
*/
function getUserId(email){
	return admin.auth().getUserByEmail(email);
}

/**
 *
 * @param uid
 * @return {Promise<admin.auth.UserRecord>}
 */
function getUserData(uid) {
    return admin.auth().getUser(uid);
}


module.exports = {
    checkAuthentication,
    elevate,
    getUserId,
  getUserData,
};
