import db from '../config/firebase.config.js';
import { badResponse } from '../utils/response.js';

// Check UID
const checkUID = async (collection, id, uid) => {
  const snapshot = await db.collection(`${collection}`).doc(id).get();

  const snapshotData = snapshot.data();

  if (snapshotData.renter_id !== uid) {
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
