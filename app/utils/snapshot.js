import db from '../config/firebase.config.js';
import { badResponse } from './response.js';

// Check Renter
const checkUsers = async (userId) => {
  try {
    const userSnapshot = await db.collection('users').doc(userId).get();

    if (!userSnapshot.exists) {
      return {
        errorUser: true,
        statusUser: 404,
        checkResponseUser: badResponse(404, 'User not found'),
      };
    }
    const userData = userSnapshot.data();
    const userRef = userData.ref;

    return {
      errorUser: false,
      renterData,
      userRef,
    };
  } catch (error) {
    console.error('Error while checking user:', error);
    return {
      errorUser: true,
      statusUser: 500,
      checkResponseUser: badResponse(
        500,
        'An error occurred while checking lessor'
      ),
    };
  }
};

// Check Product
const checkPill = async (pillId) => {
  try {
    const pillSnapshot = await db.collection('pill').doc(pillId).get();

    if (!pillSnapshot.exists) {
      return {
        errorPill: true,
        statusPill: 404,
        checkResponsePill: badResponse(404, 'Pill not found'),
      };
    }
    const pillData = pillSnapshot.data();
    const pillRef = pillSnapshot.ref;

    return {
      errorPill: false,
      pillData,
      pillRef,
    };
  } catch (error) {
    console.error('Error while checking product:', error);
    return {
      errorPill: true,
      statusPill: 500,
      checkResponsePill: badResponse(
        500,
        'An error occurred while checking product'
      ),
    };
  }
};

// get All Product
const checkAllPill = async () => {
  const allPill = await db.collection('pill').get();

  return allPill;
};

// get All Category
const checkAllCategory = async () => {
  const allCategory = await db.collection('categories').get();

  return allCategory;
};

export { checkAllPill, checkAllCategory, checkUsers, checkPill };
