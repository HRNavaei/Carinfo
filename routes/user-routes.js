const router = require('express').Router();
const authController = require('./../controller/auth-controller');
const userController = require('./../controller/user-controller');

router.route('/sign-up').post(authController.signUp);

router.route('/sign-in').post(authController.signIn);

router
  .route('/change-role')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    userController.changeRole
  );

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getUserList
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getUser
  );

module.exports = router;
