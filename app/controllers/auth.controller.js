// import admin from 'firebase-admin';
// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import { readFileSync } from 'fs';
// import db from '../config/firebase.config.js';
// import { badResponse, successResponse } from '../utils/response.js';
// import { dateTimeNow } from '../utils/time.js';

// const filename = fileURLToPath(import.meta.url);
// const filedirname = dirname(filename);

// const configPath = join(filedirname, '../config/config.json');
// const config = JSON.parse(readFileSync(configPath));

// const firebaseConfigPath = join(
//   filedirname,
//   '../config/',
//   config.firebaseConfigCredentail,
// );
// const firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, 'utf8'));

// // Initialize Firebase app
// firebase.initializeApp(firebaseConfig);

// const createUser = async (
//   email,
//   password,
//   username,
//   fullName,
//   address = '',
//   phone = '',
//   gender = 'male',
// ) => {
//   try {
//     // Validating required fields
//     const requiredFields = ['email', 'password', 'username', 'fullName'];
//     const missingFields = requiredFields.filter(
//       () => !email || !password || !username || !fullName,
//     );
//     if (missingFields.length > 0) {
//       const errorMessage = missingFields
//         .map((field) => `${field} is required`)
//         .join('. ');
//       const error = new Error(errorMessage);
//       error.statusCode = 404;
//       throw error;
//     }

//     // Check if email contains "@gmail.com"
//     if (!email.includes('@gmail.com')) {
//       const errorMessage = 'Invalid Gmail Format';
//       const error = new Error(errorMessage);
//       error.statusCode = 404;
//       throw error;
//     }

//     // Validating username uniqueness
//     const usernameSnapshot = await db
//       .collection('<collection>')
//       .where('username', '==', username)
//       .get();
//     if (!usernameSnapshot.empty) {
//       const errorMessage = `Username '${username}' is already taken`;
//       const error = new Error(errorMessage);
//       error.statusCode = 409;
//       throw error;
//     }

//     const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
//     const userRecord = userCredential.user;

//     const userDocRef = db.collection('<collection>').doc(userRecord.uid);
//     const userData = {
//       <user-collection>_id: userRecord.uid,
//       email,
//       password,
//       username,
//       fullName,
//       phone,
//       address,
//       gender,
//       email_verified: userRecord.emailVerified,
//     };

//     delete userData.password;
//     await userDocRef.set(userData);

//     await userRecord.sendEmailVerification();

//     const userRecordResponse = {
//       emailVerified: userRecord.emailVerified,
//       isAnonymous: userRecord.isAnonymous,
//       createAt: dateTimeNow(),
//     };

//     const responseData = { ...userData, userRecordResponse };
//     return responseData;
//   } catch (error) {
//     console.error('Error creating user', error.message);
//     throw error;
//   }
// };

// const register = async (req, res) => {
//   const {
//     email,
//     password,
//     username,
//     fullName,
//     address,
//     phone,
//     gender,
//   } = req.body;

//   try {
//     const userResponse = await createUser(
//       email,
//       password,
//       username,
//       fullName,
//       address,
//       phone,
//       gender,
//     );

//     delete userResponse.password;

//     const response = successResponse(
//       201,
//       'User Success Register, Check your email for verification',
//       userResponse,
//     );
//     res.status(201).json(response);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const response = badResponse(
//       statusCode,
//       'Error While Creating User',
//       error.message,
//     );
//     res.status(statusCode).json(response);
//   }
// };

// // Login <user-collection> Handler
// const loginUser = async (email, password) => {
//   try {
//     const userCredential = await firebase
//       .auth()
//       .signInWithEmailAndPassword(email, password);

//     // Generate JWT Token
//     const token = await userCredential.user.getIdToken();
//     const userRecord = await userCredential.user.getIdTokenResult();

//     return {
//       token,
//       loginTime: dateTimeNow(),
//       userRecord,
//     };
//   } catch (error) {
//     console.error('Error logging in user:', error);
//     throw error;
//   }
// };

// const login = async (req, res) => {
//   const { identifier, password } = req.body;

//   try {
//     if (identifier.length === 0) {
//       const response = badResponse(400, 'Email or username is required');
//       return res.status(400).json(response);
//     }

//     if (password.length === 0) {
//       const response = badResponse(400, 'Password is required');
//       return res.status(400).json(response);
//     }

//     // Cek apakah identifier merupakan email atau username
//     let <user-collection>Snapshot;
//     if (identifier.includes('@')) {
//       // Jika identifier mengandung karakter '@', maka dianggap sebagai email
//       <user-collection>Snapshot = await db
//         .collection('<collection>')
//         .where('email', '==', identifier)
//         .get();
//     } else {
//       // Jika tidak mengandung karakter '@', maka dianggap sebagai username
//       <user-collection>Snapshot = await db
//         .collection('<collection>')
//         .where('username', '==', identifier)
//         .get();
//     }

//     if (<user-collection>Snapshot.empty) {
//       // Jika tidak ada <user-collection> dengan email atau username yang sesuai
// eslint-disable-next-line max-len
//       const response = badResponse(404, 'User not found, please make sure your email format or username is correct');
//       return res.status(404).json(response);
//     }

//     const <user-collection>Data = <user-collection>Snapshot.docs[0].data();
// eslint-disable-next-line max-len
//     const <user-collection>Ref = db.collection('<collection>').doc(<user-collection>Data.<user-collection>_id);

//     const { token, userRecord } = await loginUser(<user-collection>Data.email, password);

//     const verifiedData = await userRecord.claims.email_verified;
//     if (verifiedData === true) {
//       await <user-collection>Ref.update({ email_verified: true });
//     }

//     const responseData = {
//       token,
//       <user-collection>: {
//         ...<user-collection>Data,
//       },
//     };

//     const response = successResponse(200, 'User Success Login', responseData);
//     return res.status(200).json(response);
//   } catch (error) {
//     let errorMessage = '';
//     let status = null;

//     if (error.code === 'auth/wrong-password') {
//       status = 400;
//       errorMessage = 'Incorrect password';
//     } else if (error.code === 'auth/invalid-email') {
//       status = 400;
//       errorMessage = 'Invalid email address';
//     } else if (error.code === 'auth/user-not-found') {
//       status = 404;
//       errorMessage = 'User not found';
//     } else {
//       status = 500;
//       errorMessage = `Error logging in user: ${error}`;
//     }
//     const response = badResponse(status, errorMessage);
//     return res.status(status).json(response);
//   }
// };

// // Logout <collection> Handler
// const logout = async (req, res) => {
//   try {
//     const { authorization } = req.headers;
//     const { uid, email } = req.user;
//     if (!authorization || !authorization.startsWith('Bearer ')) {
//       throw new Error('Unauthorized');
//     }

//     const token = authorization.split('Bearer ')[1];

//     await db.collection('tokens').doc(token).set({ invalid: true });

//     await admin.auth().revokeRefreshTokens(uid);

//     const logoutTime = dateTimeNow();

//     // Tandai token sebagai tidak valid di Firestore
//     await db
//       .collection('tokens')
//       .doc(token)
//       .set({
//         email, uid, invalid: true, time: logoutTime, type: 'logout tokens', token,
//       });

//     const responseData = { email, time: logoutTime };

//     const response = successResponse(200, 'User logged out successfully', responseData);
//     res.status(200).json(response);
//   } catch (error) {
//     console.error(error);
//     const response = badResponse(401, 'Failed to logout user');
//     res.status(401).json(response);
//   }
// };

// const forgetPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     // Kirim email reset password
//     await firebase.auth().sendPasswordResetEmail(email);

//     const response = successResponse(200, 'Reset password email has been sent');
//     return res.status(200).json(response);
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     const response = badResponse(500, 'Failed to send password reset email');
//     return res.status(500).json(response);
//   }
// };

// export {
//   login,
//   register,
//   logout,
//   forgetPassword,
// };
