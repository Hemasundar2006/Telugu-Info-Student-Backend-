const express = require('express');
const { protect } = require('../middleware/auth');
const { predictColleges } = require('../controllers/predictorController');
const validate = require('../middleware/validate');
const { predictSchema } = require('../validators/predictValidator');

const router = express.Router();

router.post('/predict', protect, validate(predictSchema), predictColleges);

module.exports = router;
