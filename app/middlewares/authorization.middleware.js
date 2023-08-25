import db from '../config/firebase.config.js';
import { badResponse } from '../utils/response.js';

// Verify User
const verifyUsers = async (username, uid) => {
  try {
    // Check User
    const userSnapshot = await db
      .collection('users')
      .where('username', '==', username)
      .get();

    if (userSnapshot.empty) {
      return {
        errorUser: true,
        statusUser: 404,
        checkResponseUser: badResponse(404, 'User not found'),
      };
    }

    const userData = userSnapshot.docs[0].data();

    const userRef = userSnapshot.docs[0].ref;

    // Check Auth Token
    if (userData.user_id !== uid) {
      return {
        errorUser: true,
        statusUser: 403,
        checkResponseUser: badResponse(403, 'Not allowed'),
      };
    }

    return {
      errorUser: false,
      userData,
      userRef,
    };
  } catch (error) {
    console.error('Error while checking username and UID:', error);
    return {
      errorUser: true,
      statusUser: 500,
      checkResponseUser: badResponse(
        500,
        'An error occurred while checking username and UID'
      ),
    };
  }
};

// Check UID
const checkUID = async (collection, id, uid) => {
  const snapshot = await db.collection(`${collection}`).doc(id).get();

  const snapshotData = snapshot.data();

  if (snapshotData.user_id !== uid) {
    return {
      errorUID: true,
      statusUID: 403,
      checkResponseUID: badResponse(403, 'Not allowed'),
    };
  }
  return {
    errorUID: false,
    snapshotData,
  };
};

export { verifyUsers, checkUID };
