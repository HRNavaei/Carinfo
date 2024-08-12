const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Please enter the store name.'],
    },
    location: {
      type: String,
      required: [true, 'Please enter the location.'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter the price.'],
    },
    website: {
      type: String,
    },
    telNumber: {
      type: String,
    },
  },
  {
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret._id;
        delete ret.id;
        return ret;
      },
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret._id;
        delete ret.id;
        return ret;
      },
    },
  }
);

// Custom validation function
sellerSchema.pre('validate', function (next) {
  if (!this.telNumber && !this.website) {
    this.invalidate(
      'telNumber',
      'You should at least provide a telephone number or a website.'
    );
  }

  next();
});

const carSchema = new mongoose.Schema(
  {
    manufacturer: {
      type: String,
      required: [true, 'Please enter the manufacturer.'],
      lowercase: true,
    },
    model: {
      type: String,
      required: [true, 'Please enter the model.'],
      lowercase: true,
    },
    releaseYear: {
      type: Number,
      required: true,
      validate: {
        validator: function (val) {
          return val >= 1885 && val <= new Date().getFullYear() + 1;
        },
        message: 'Car release year is invalid.',
      },
    },
    description: {
      type: String,
    },
    numOfRatings: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Ratings average can not be less than 1.'],
      max: [5, 'Ratings average can not be more than 5.'],
      default: null,
    },
    sellers: [sellerSchema],
    minPrice: {
      type: Number,
      default: null,
    },
  },
  {
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  }
);

// Declaring unique compound for car scehma
carSchema.index({ manufacturer: 1, model: 1, releaseYear: 1 }, { unique: 1 });

carSchema.virtual('image').get(function () {
  // Putting the link to the car image
  let { manufacturer, model, releaseYear } = this;

  manufacturer = manufacturer.replace(/ /g, '-');
  model = model.replace(/ /g, '-');
  releaseYear = releaseYear;

  return `${process.env.PROTOCOL}://${process.env.HOST}/cars/images/${manufacturer}_${model}_${releaseYear}.jpg`;
});

carSchema.methods.findSellerById = function (id) {
  return this.sellers.find((el) => el._id.equals(id));
};

carSchema.methods.findSellerByStoreNameAndLocation = function (
  storeName,
  location
) {
  return this.sellers.find(
    // storeName and location together make a unique compund in a list of sellers of a same car
    (el) => el.storeName === storeName && el.location === location
  );
};

module.exports = mongoose.model('Car', carSchema);
