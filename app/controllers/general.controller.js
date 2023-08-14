// import { badResponse, successResponse } from '../utils/response.js';
// import db from '../config/firebase.config.js';

// eslint-disable-next-line consistent-return
const testApp = async (req, res) => {
  try {
    console.log('Apps is running');
    return res.status(200).send('App is running');
  } catch (error) {
    console.error(error);
  }
};

const Hallo = async (req, res) => {
  try {
    console.log('Apps is running');
    return res.status(200).send('App is running');
  } catch (error) {
    console.error(error);
  }
};

export { testApp, Hallo };
