import Fuse from 'fuse.js';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

import getRandomElements from '../utils/random.js';
import { badResponse, successResponse } from '../utils/response.js';
import {
  checkUsers,
  checkPill,
  checkAllPill,
  checkAllCategory,
} from '../utils/snapshot.js';

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

export { getHomeData, searchPill, getAllCategories, getPillById };
