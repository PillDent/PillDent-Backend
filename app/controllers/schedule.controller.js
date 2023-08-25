import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import db from '../config/firebase.config.js';

import { verifyUsers } from '../middlewares/authorization.middleware.js';

import { checkSchedule } from '../utils/snapshot.js';

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
const addSchedule = async (req, res) => {
  try {
    const {
      title,
      receptor,
      pillName,
      dosage,
      startTime,
      startDate,
      endDate,
      note,
    } = req.body;

    const { username } = req.params;
    const { uid } = req.user;

    const { errorUser, statusUser, checkResponseUser, userData } =
      await verifyUsers(username, uid);

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }

    const scheduleRef = db.collection('schedules').doc();
    const scheduleId = scheduleRef.id;

    const scheduleData = {
      schedule_id: scheduleId,
      username: userData.username,
      title,
      receptor,
      pillName,
      dosage,
      startTime,
      startDate,
      endDate,
      note,
      progress: 0,
    };

    await scheduleRef.set(scheduleData);

    const response = successResponse(200, 'Success Add Schedule', scheduleData);

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating schedule:', error);
    const response = badResponse(
      500,
      'An error occurred while adding schedule',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getSchedule = async (req, res) => {
  try {
    const { username } = req.params;

    const scheduleRef = db.collection('schedules');
    const querySnapshot = await scheduleRef
      .where('username', '==', username)
      .get();

    const schedules = [];
    querySnapshot.forEach((doc) => {
      const schedule = doc.data();
      schedules.push(schedule);
    });

    const response = successResponse(200, 'Success Add Schedule', schedules);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error get schedule:', error);
    const response = badResponse(
      500,
      'An error occurred while get schedule',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Delete Schedule By Id Handlers
const deleteSchedule = async (req, res) => {
  const { scheduleId, username } = req.params;
  const { uid } = req.user;

  try {
    // Cek apakah produk dengan ID yang diberikan ada di database
    const {
      errorSchedule,
      statusSchedule,
      checkResponseSchedule,
      scheduleRef,
    } = await checkSchedule(scheduleId);

    if (errorSchedule) {
      return res.status(statusSchedule).json(checkResponseSchedule);
    }

    const { errorUser, statusUser, checkResponseUser } = await verifyUsers(
      username,
      uid
    );

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }

    // Hapus schedule dari database
    await scheduleRef.delete();

    const response = successResponse(200, 'Schedule deleted successfully');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    const response = badResponse(500, 'Error deleting schedule', error.message);
    return res.status(500).json(response);
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { username, scheduleId } = req.params;
    const { uid } = req.user;

    const { errorUser, statusUser, checkResponseUser, userData } =
      await verifyUsers(username, uid);

    if (errorUser) {
      return res.status(statusUser).json(checkResponseUser);
    }

    const scheduleRef = db.collection('schedules').doc(scheduleId);
    const scheduleSnapshot = await scheduleRef.get();

    if (!scheduleSnapshot.exists) {
      return res.status(404).json(badResponse(404, 'Jadwal tidak ditemukan'));
    }

    const scheduleData = scheduleSnapshot.data();

    if (scheduleData.username !== username) {
      return res
        .status(403)
        .json(
          badResponse(
            403,
            'Anda tidak memiliki izin untuk mengupdate jadwal ini'
          )
        );
    }

    const currentDate = new Date();
    const startDate = new Date(scheduleData.startDate);
    const endDate = new Date(scheduleData.endDate);

    if (currentDate < startDate || currentDate > endDate) {
      return res
        .status(400)
        .json(
          badResponse(
            400,
            'Jadwal minum obat belum dimulai atau sudah berakhir'
          )
        );
    }

    const daysBetween = (endDate - startDate) / (1000 * 60 * 60 * 24) - 1;
    const daysElapsed = (currentDate - startDate) / (1000 * 60 * 60 * 24);

    let existingProgress = scheduleData.progress || 0;
    const newProgress = (daysElapsed / daysBetween) * 100;
    const targetProgress = (98 / 100) * 100;

    // If new progress surpasses the target progress, set it to the target
    if (existingProgress + newProgress >= targetProgress) {
      existingProgress = 100;
    } else {
      existingProgress = existingProgress + newProgress;
    }

    existingProgress = parseFloat(existingProgress.toFixed(2));

    if (existingProgress > 100) {
      return res
        .status(400)
        .json(badResponse(400, 'Progress sudah mencapai 100%'));
    }

    // Update progress in the schedule document
    await scheduleRef.update({ progress: existingProgress });
    const updatedScheduleSnapshot = await scheduleRef.get();
    const updatedScheduleData = updatedScheduleSnapshot.data();

    const response = successResponse(200, 'Progress berhasil diperbarui', {
      ...updatedScheduleData,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating schedule progress:', error);
    const response = badResponse(
      500,
      'Terjadi kesalahan saat memperbarui progress',
      error.message
    );

    return res.status(500).json(response);
  }
};

export { addSchedule, getSchedule, deleteSchedule, updateSchedule };
