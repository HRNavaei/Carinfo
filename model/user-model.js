const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Please enter your name.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter your email.'],
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please enter a valid email.',
      },
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please enter the password.'],
      validate: {
        validator: function (val) {
          const whitespaceFilteredVal = val.replace(/\s+/g, '');
          return validator.isAlphanumeric(whitespaceFilteredVal);
        },
        message:
          'Password can only have alphabetical, numerical and space characters.',
      },
      minLength: [6, 'Password must at least have 6 character.'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please enter the password confirm.'],
      validate: {
        validator: function (val) {
          return this.password === val;
        },
        message: 'Password confirmation does not match the password.',
      },
    },
    signedUpAt: {
      type: Date,
      default: new Date(),
    },
    passwordChangedAt: {
      type: Date,
    },
    role: {
      type: String,
      lowercase: true,
      enum: {
        values: ['user', 'admin'],
        message: 'Invalid user role.',
      },
      default: 'user',
    },
  },
  {
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.verifyPassword = async function (checkingPassword) {
  return await bcrypt.compare(checkingPassword, this.password);
};

userSchema.methods.passwordChangedAfter = function (date) {
  return date < this.passwordChangedAt;
};

module.exports = mongoose.model('users', userSchema);
