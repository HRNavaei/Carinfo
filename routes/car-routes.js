const router = require('express').Router();
const carController = require('./../controller/car-controller');
const authController = require('./../controller/auth-controller');

router.route('/').get(authController.protect, carController.getAllCars);

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    carController.addCar
  );

router
  .route('/available-cars')
  .get(authController.protect, carController.getAvailableCars);

router.route('/:id').get(authController.protect, carController.getCar);

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    carController.updateCar
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    carController.deleteCar
  );

router
  .route('/:id/sellers')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    carController.addSeller
  );

router
  .route('/:carId/sellers/:sellerId')
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    carController.deleteSeller
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    carController.updateSeller
  );

module.exports = router;
