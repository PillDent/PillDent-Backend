import Fuse from 'fuse.js';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

import getRandomElements from '../utils/random.js';
import { badResponse, successResponse } from '../utils/response.js';
import { verifyUsers } from '../middlewares/authorization.middleware.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { storage, bucketName } from '../config/storage.config.js';
import db from '../config/firebase.config.js';
import predictionModel from '../models/image.model.js';
import { dateTimeNow } from '../utils/time.js';

import {
  checkUsers,
  checkPill,
  checkAllPill,
  checkAllCategory,
} from '../utils/snapshot.js';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

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

// Home Handler
const getHomeData = async (req, res) => {
  try {
    const allPill = await checkAllPill();

    console.log('Working 26 Aug Tengah Malam');

    const pills = allPill.docs.map((doc) => doc.data());

    const allCategory = await checkAllCategory();
    const categories = [];

    await Promise.all(
      allCategory.docs.map(async (categoryDoc) => {
        const categoryData = categoryDoc.data();
        const category = { name: categoryData.name };

        categories.push(category);
      })
    );

    // Randomly select 20 pills
    const randomPill = getRandomElements(pills, 20);

    const responseData = {
      pills: randomPill,
      categories,
    };

    const response = successResponse(
      200,
      'Dashboard data retrieved successfully',
      responseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while fetching dashboard data',
      error.message
    );
    return res.status(500).json(response);
  }
};
// Search Pill Handler
const searchPill = async (req, res) => {
  try {
    const { name, category } = req.query;

    if (!name) {
      const response = badResponse(
        400,
        'Please enter a word to search for a pill'
      );
      return res.status(400).json(response);
    }

    // Retrieve all pill data from Firestore
    const allPill = await checkAllPill();
    const pills = allPill.docs.map((doc) => doc.data());

    // Create Fuse.js options
    const fuseOptions = {
      keys: ['name'],
      threshold: 0.3,
    };

    // Create a Fuse instance with the pill data and options
    const fuse = new Fuse(pills, fuseOptions);

    // Perform search using Fuse.js
    let searchResults = fuse.search(name);

    // Filter by category
    if (category) {
      searchResults = searchResults.filter(
        (result) => result.item.category === category
      );
    }

    // Retrieve only the necessary properties from the search results
    const formattedResults = await Promise.all(
      searchResults.map(async (result) => {
        const {
          item: { side_effect, warning, dosis, description },
        } = result;

        return {
          pill_id: result.item.pill_id,
          name: result.item.name,
          category: result.item.category,
          side_effect,
          warning,
          dosis,
          description,
        };
      })
    );

    if (formattedResults.length === 0) {
      const response = badResponse(404, 'Pill not found');
      return res.status(404).json(response);
    }

    const response = successResponse(
      200,
      'Pill search successful',
      formattedResults
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while searching pill:', error);

    const response = badResponse(
      500,
      'An error occurred while searching pill',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Get All Categories Handler
const getAllCategories = async (req, res) => {
  try {
    const allCategory = await checkAllCategory();
    const categories = [];

    allCategory.forEach((doc) => {
      const data = doc.data();
      categories.push({ id: doc.id, name: data.name, iconUrl: data.iconUrl });
    });

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories', error);
    return res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Detail pill Handler
const getPillById = async (req, res) => {
  try {
    const { pillId } = req.params;

    const { errorPill, statusPill, checkResponsePill, pillData } =
      await checkPill(pillId);

    if (errorPill) {
      return res.status(statusPill).json(checkResponsePill);
    }

    const responseData = { ...pillData };
    const response = successResponse(
      200,
      'pill details retrieved successfully',
      responseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting pill details', error);
    const response = badResponse(
      500,
      'Error while getting pill details',
      error.message
    );

    return res.status(500).json(response);
  }
};

const scanPill = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      }
      if (err) {
        console.error('Error saat mengunggah file', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      }
      const { uid } = req.user;
      const { username } = req.params;

      // Check User
      const { errorUser, statusUser, checkResponseUser, userData } =
        await verifyUsers(username, uid);

      if (errorUser) {
        return res.status(statusUser).json(checkResponseUser);
      }

      const { file } = req;

      if (!req.file) {
        const response = badResponse(400, 'Tidak ada file yang diunggah.');
        return res.status(400).json(response);
      }

      // Cek ukuran file
      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB

      if (file.size > maxSizeInBytes) {
        const response = badResponse(
          413,
          'Ukuran gambar melebihi batas maksimum.'
        );
        return res.status(413).json(response);
      }

      const subCategory = 'speaker';

      const predictionResult = await predictionModel(file, subCategory);

      if (predictionResult.success) {
        const imageId = uuidv4();
        const originalFileName = file.originalname;
        const fileName = `${originalFileName
          .split('.')
          .slice(0, -1)
          .join('.')}_${username}.${originalFileName.split('.').pop()}`.replace(
          /\s+/g,
          '_'
        );
        const filePath = `pill/${subCategory}/${fileName}`;
        const blob = storage.bucket(bucketName).file(filePath);

        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
          predefinedAcl: 'publicRead',
        });

        blobStream.on('error', (error) => {
          console.error('Error saat mengunggah file:', error);
          const response = badResponse(
            500,
            'Terjadi kesalahan saat mengunggah gambar.'
          );
          return res.status(500).json(response);
        });

        blobStream.on('finish', async () => {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

          try {
            const pillScanResult = db.collection('scan-result').doc();
            const pillScanid = pillScanResult.id;

            const pillScanResultData = {
              pillScanId: pillScanid,
              imageUrl: publicUrl,
              create_at: dateTimeNow(),
              image_id: imageId,
              username,
            };

            // Simpan data scan ke koleksi result-scan di Firestore
            await db
              .collection('scan-result')
              .doc(pillScanResultData.pillScanId)
              .set(pillScanResultData);

            const responseData = {
              ...pillScanResultData,
              pill_data: 'Result From Machine Learning',
            };
            delete responseData.username;

            const response = successResponse(
              200,
              'Success scan pill ',
              responseData
            );
            return res.status(200).json(response);
          } catch (error) {
            console.error('Error :', error);
            const response = badResponse(
              500,
              'An error occurred while scan pill',
              error.message
            );
            return res.status(500).json(response);
          }
        });

        blobStream.end(file.buffer);
      } else {
        const { errorMessage } = predictionResult;
        console.error('Error :', errorMessage);
        const response = badResponse(
          400,
          'Category dan gambar yang di input tidak sesuai',
          errorMessage
        );
        return res.status(400).json(response);
      }
      return null;
    });
    return null;
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    const response = badResponse(
      500,
      'An error occurred while upload images',
      error.message
    );
    return res.status(500).json(response);
  }
};

export { getHomeData, searchPill, getAllCategories, getPillById, scanPill };
