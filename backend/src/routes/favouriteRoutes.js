/**
 * Favourite Routes
 * /api/favourites
 */
const express = require('express');
const router = express.Router();
const {
  getFavourites,
  addFavourite,
  removeFavourite,
} = require('../controllers/favouriteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getFavourites);
router.post('/:productId', addFavourite);
router.delete('/:productId', removeFavourite);

module.exports = router;
