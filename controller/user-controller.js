const OperationalError = require('../utils/OperationalError');
const User = require('./../model/user-model');
const catchAsync = require('./../utils/catch-async');
const QueryFeatures = require('./../utils/QueryFeatures');

// Admin specific features
exports.getUserList = catchAsync(async (req, res, next) => {
  const queryFeatures = new QueryFeatures(req.query, User.find());
  queryFeatures.filter().project().sort().paginate();

  queryFeatures.dbQuery.select('-password -passwordChangedAt');
  const userList = await queryFeatures.dbQuery;

  res.status(200).json({
    status: 'success',
    data: {
      userList,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    '-password -passwordChangedAt'
  );

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.changeRole = catchAsync(async (req, res, next) => {
  const userEmail = req.body.email;
  const targetRole = req.body.role;

  const updatedUser = await User.findOneAndUpdate(
    { email: userEmail },
    { role: targetRole },
    { runValidators: true, new: true }
  );

  if (!updatedUser) throw new OperationalError('USER_NOT_FOUND');

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

// Features for all types of user
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const user = {
    name: req.user.name,
    email: req.user.email,
  };
  if (req.user.role === 'admin') {
    user.admin = true;
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
