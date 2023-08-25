import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import db from '../config/firebase.config.js';

import { verifyUsers } from '../middlewares/authorization.middleware.js';

import getRandomElements from '../utils/random.js';
import { badResponse, successResponse } from '../utils/response.js';

const filename = fileURLToPath(import.meta.url);
const filedirname = dirname(filename);

const configPath = join(filedirname, '../config/config.json');
const config = JSON.parse(readFileSync(configPath));

const firebaseConfigPath = join(
  filedirname,
  '../config/',
  config.firebaseConfigCredentail
);
const firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get User Profile Handler
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    const { errorUser, statusUser, checkResponseUser, userData } =
      await verifyUsers(username, uid);

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }
    const responseData = userData;

    const response = successResponse(
      200,
      'Profile retrieved successfully',
      responseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting user profile:', error);
    const response = badResponse(
      500,
      'An error occurred while getting user profile',
      error.message
    );

    return res.status(500).json(response);
  }
};

// Update User Profile Handler
const updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const { fullName, address, phone, gender, email } = req.body;

    const { errorUser, statusUser, checkResponseUser, userData, userRef } =
      await verifyUsers(username, uid);

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }
    // Check Input Data For Edit
    const userUpdateData = {};

    if (fullName !== undefined && fullName !== '') {
      userUpdateData.fullName = fullName;
    }

    if (address !== undefined && address !== '') {
      userUpdateData.address = address;
    }

    if (phone !== undefined && phone !== '') {
      userUpdateData.phone = phone;
    }

    if (gender !== undefined && gender !== '') {
      userUpdateData.gender = gender;
    }

    if (Object.keys(userUpdateData).length === 0) {
      const response = successResponse(
        200,
        'Berhasil update profile tapi tidak ada data yang diupdate',
        userData
      );
      return res.status(200).json(response);
    }

    // Periksa apakah ada perubahan email
    if (email && email !== userData.email) {
      // Perbarui alamat email pada data profil user
      userUpdateData.email = email;

      // Update email di Firebase Authentication
      await firebase.auth().currentUser.updateEmail(email);

      // Kirim ulang email verifikasi ke alamat email baru
      await firebase.auth().currentUser.sendEmailVerification();
    }

    // Perbarui data profile user pada database
    await userRef.update(userUpdateData);

    // Ambil snapshot terbaru dari data profile yang diperbarui
    const updatedProfileSnapshot = await userRef.get();
    const updatedProfileData = updatedProfileSnapshot.data();

    delete updatedProfileData.userRecordData;
    console.log(userUpdateData);
    if (email && email !== userData.email) {
      const response = successResponse(
        200,
        'Profile updated successfully, check your email to verify',
        updatedProfileData
      );
      return res.status(200).json(response);
    }

    const response = successResponse(
      200,
      'Profile updated successfully',
      updatedProfileData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating user profile:', error);

    const response = badResponse(
      500,
      'An error occurred while updating user profile',
      error.message
    );

    return res.status(500).json(response);
  }
};

// Delete Account user Handler
const deleteUserById = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    const { errorUser, statusUser, checkResponseUser, userData, userRef } =
      await verifyUsers(username, uid);

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }

    // Hapus user
    await userRef.delete();

    // Hapus data lessor yang terkait dengan user tersebut
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', userData.username)
      .get();

    if (!lessorSnapshot.empty) {
      const lessorId = lessorSnapshot.docs[0].id;
      const lessorRef = db.collection('lessors').doc(lessorId);
      await lessorRef.delete();
    }

    const response = successResponse(
      200,
      'User and associated lessor deleted successfully'
    );
    return res.json(response);
  } catch (error) {
    console.error('Error while deleting user:', error);

    const response = badResponse(
      500,
      'An error occurred while deleting user',
      error.message
    );

    return res.status(500).json(response);
  }
};

export { getUserProfile, updateProfile, deleteUserById };
