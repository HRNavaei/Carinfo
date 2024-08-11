const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const OperationalError = require('./../utils/OperationalError');
const User = require('./../model/user-model');
const catchAsync = require('./../utils/catch-async');

exports.signUp = catchAsync(async (req, res, next) => {
  // 1. Declare a proper user object based on the provided data
  const userFields = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: 'blah',
  };

  // 2. Save the user document in the database
  let newUser;
  try {
    newUser = await User.create(userFields);
  } catch (err) {
    if (err.code === 11000) throw handleUserDuplicateError(err);
    throw err;
  }
  // 3. Generate the JWT
  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);

  /*
   * The code below is for setting the cookie options and sending the token
   * as a cookie to the client. But now the cookie is not used and the token
   * is sent regularly along with other data to get it back as a Bearer token.
   * The code below is for any possible use in future.
   */
  // const jwtCookieOpt = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_AFTER * 24 * 60 * 60 * 1000
  //   ),
  //   secure: true,
  //   httpOnly: true,
  // };
  // res.cookie('jwt', token, jwtCookieOpt);

  // 4. Send the proper response containing the token
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Find user and check if a user with the provided email exists
  const user = await User.findOne({ email });
  if (!user) throw new OperationalError('INCORRECT_EMAIL_OR_PASS');

  // 2. Check if the provided password is correct
  const isPasswordVerified = await user.verifyPassword(password);
  if (!isPasswordVerified)
    throw new OperationalError('INCORRECT_EMAIL_OR_PASS');

  // 3. Generate the JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_AFTER,
  });

  /*
   * The code below is for setting the cookie options and sending the token
   * as a cookie to the client. But now the cookie is not used and the token
   * is sent regularly along with other data to get it back as a Bearer token.
   * The code below is for any possible use in future.
   */
  // const jwtCookieOpt = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_AFTER * 24 * 60 * 60 * 1000
  //   ),
  //   secure: true,
  //   httpOnly: true,
  // };
  // res.cookie('jwt', token, jwtCookieOpt);

  // 4. Send the proper response containing the token
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting the JWT token from the headers and check if it's provided
  const tokenHeader = req.headers.authorization;
  let token;
  if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
    token = tokenHeader.split(' ')[1];
  } else {
    console.log('here1');
    console.log(tokenHeader);
    throw new OperationalError('NOT_LOGGED_IN');
  }

  // 2. Verifying the token
  let decodedToken;
  try {
    decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      console.log('here2');
      throw new OperationalError('NOT_LOGGED_IN');
    }
    if (err.name === 'TokenExpiredError')
      throw new OperationalError('LOG_IN_AGAIN');
  }

  // 3. Fetching the user document from database after authentication
  const user = await User.findById(decodedToken.id);

  /*
   * Two things may expire the jwt token despite being verified by the secret
   * 1. Changing password
   * 2. Deleting user account
   */

  // 4.1) Handling user account deletion
  if (!user) throw new OperationalError('USER_NOT_FOUND');

  // 4.2) Handling password change
  if (user.passwordChangedAfter(new Date(decodedToken.iat * 1000)))
    throw new OperationalError('PASSWORD_CHANGED');

  req.user = user;
  next();
});

// Functions used in the middlewares
function handleUserDuplicateError(err) {
  const uniqueProperties = err.keyValue;
  const revisedErr = new OperationalError('DUPLICATE_KEY');
  revisedErr.errors = [];

  /*
   * The reason for the having the condition below is to make it possible to add
   * more unique fields in the future
   */
  if (
    // With the condition below we ensure that a specific error has occurred
    Object.keys(uniqueProperties).length === 1 &&
    'email' in uniqueProperties
  ) {
    const message = `The email address "${uniqueProperties.email}" already exists.`;
    revisedErr.errors.push({
      isCompound: false,
      uniqueField: 'email',
      message,
    });
  }

  return revisedErr;
}

exports.restrictTo = (role) => {
  return catchAsync(async (req, res, next) => {
    if (req.user.role === role) next();
    else throw new OperationalError('ACCESS_DENIED');
  });
};
