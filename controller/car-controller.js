const mongoose = require('mongoose');
const OperationalError = require('../utils/OperationalError');
const Car = require('./../model/car-model');
const catchAsync = require('./../utils/catch-async');
const QueryFeatures = require('../utils/QueryFeatures');

exports.addCar = catchAsync(async (req, res, next) => {
  let car;
  try {
    car = await Car.create({
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      releaseYear: req.body.releaseYear,
      description: req.body.description,
    });
  } catch (err) {
    if (err.code === 11000) throw handleCarDuplicateError(err);

    throw err;
  }

  res.status(201).json({
    status: 'success',
    data: {
      car,
    },
  });
});

exports.getAllCars = catchAsync(async (req, res, next) => {
  const queryFeatures = new QueryFeatures(req.query, Car.find())
    .filter()
    .project()
    .sort()
    .paginate();

  queryFeatures.dbQuery.select('-numOfRatings -description -sellers');

  const cars = await queryFeatures.dbQuery;
  res.status(200).json({
    status: 'success',
    result: cars.length,
    data: {
      cars,
    },
  });
});

exports.getCar = catchAsync(async (req, res, next) => {
  const carId = req.params.id;
  if (!areIdsValid(carId)) throw new OperationalError('INVALID_URL');

  const car = await Car.findById(carId);
  if (!car) throw new OperationalError('CAR_NOT_FOUND');

  const carObj = car.toObject();
  delete carObj.link;

  res.status(200).json({
    status: 'success',
    data: {
      car: carObj,
    },
  });
});

exports.updateCar = catchAsync(async (req, res, next) => {
  const carId = req.params.id;
  if (!areIdsValid(carId)) throw new OperationalError('INVALID_URL');

  let updatedCar;
  try {
    updatedCar = await Car.findByIdAndUpdate(carId, req.body, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err.code === 11000) throw handleCarDuplicateError(err);

    throw err;
  }

  res.status(200).json({
    status: 'success',
    data: {
      car: updatedCar,
    },
  });
});

exports.deleteCar = catchAsync(async (req, res, next) => {
  const carId = req.params.id;
  if (!areIdsValid(carId)) throw new OperationalError('INVALID_URL');

  const car = await Car.findByIdAndDelete(carId);
  if (!car) throw new OperationalError('CAR_NOT_FOUND');

  res.status(204).send();
});

exports.getAvailableCars = catchAsync(async (req, res, next) => {
  const queryParams = req.query;

  /*
   * Aggregation pipeline is used here to process data. in
   * the steps below some necessary objects are created to
   * be put in the pipeline as stages.
   */

  const pipeline = [
    {
      $unwind: '$sellers',
    },
    {
      $addFields: {
        storeName: '$sellers.storeName',
        price: '$sellers.price',
        location: '$sellers.location',
        telNumber: '$sellers.telNumber',
        website: '$sellers.website',
      },
    },
    {
      $project: {
        description: 0,
        sellers: 0,
        minPrice: 0,
        __v: 0,
        _id: 0,
      },
    },
  ];

  // Creating or-criteria array for $match stage
  const carFilters = [];
  let modelsQP = queryParams.models;
  if (modelsQP) {
    const models = modelsQP.split(',');

    models.forEach((val) => {
      carFilters.push({ model: val });
    });

    pipeline.unshift({
      $match: {
        $or: carFilters,
      },
    });
  }

  // Creating the sort object for $sort stage
  const sortQP = queryParams.sort;
  const sortObj = {};
  if (sortQP) {
    const sortFields = sortQP.split(',');
    sortFields.forEach((el) => {
      let fieldName = el;
      let sortType = 1; // 1 for ascending/-1 for descending

      if (fieldName.startsWith('-')) {
        sortType = -1;
        fieldName = fieldName.slice(1);
      }

      sortObj[fieldName] = sortType;
    });

    pipeline.push({
      $sort: sortObj,
    });
  }

  // Creating the pagination stage
  let limit = queryParams.limit * 1 || 6;

  let page = queryParams.page * 1 || 1;

  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip }, { $limit: limit });

  const listOfAvailableCars = await Car.aggregate(pipeline);

  res.status(200).json({
    status: 'success',
    result: listOfAvailableCars.length,
    data: {
      listOfAvailableCars,
    },
  });
});

// Seller-related functions
exports.addSeller = catchAsync(async (req, res, next) => {
  // 1. Get the id of associated car and check if it is valid
  const carId = req.params.id;
  if (!areIdsValid(carId, sellerId)) throw new OperationalError('INVALID_URL');

  // 2. Update the car by pushing the new seller to its sellers array property
  const updatedCar = await Car.findByIdAndUpdate(
    carId,
    {
      $push: { sellers: { $each: [req.body], $sort: { price: 1 } } },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // 3. Fetch the newly created seller from database
  const newSeller = updatedCar.findSellerByStoreNameAndLocation(
    req.body.storeName,
    req.body.location
  );

  // 4. Modify the value of minPrice property in tha car document
  if (newSeller.price < updatedCar.minPrice || updatedCar.minPrice === null)
    await Car.findByIdAndUpdate(carId, { minPrice: newSeller.price });

  // 5. Send the proper response to client
  res.status(201).json({
    status: 'success',
    data: {
      seller: newSeller,
    },
  });
});

exports.deleteSeller = catchAsync(async (req, res, next) => {
  // 1. Get the car id and seller id and check if they are valid
  const carId = req.params.carId;
  const sellerId = req.params.sellerId;
  if (!areIdsValid(carId, sellerId)) throw new OperationalError('INVALID_URL');

  // 2. Fetch the associated car from database and check if it is existed
  const car = await Car.findById(carId);
  if (!car) throw new OperationalError('CAR_NOT_FOUND');

  // 3. Update the sellers array of the car
  const updatedCar = await Car.findByIdAndUpdate(
    carId,
    {
      $pull: { sellers: { _id: sellerId } },
    },
    {
      new: true,
    }
  );

  // 4. Check if the seller has not been found
  if (updatedCar.sellers.length === car.sellers.length)
    throw new OperationalError('SELLER_NOT_FOUND');

  // 5. Send the proper response to the client
  res.status(204).json();
});

exports.updateSeller = catchAsync(async (req, res, next) => {
  // 1. Get the car id and seller id and check if they are valid
  const carId = req.params.carId;
  const sellerId = req.params.sellerId;
  if (!areIdsValid(carId, sellerId)) throw new OperationalError('INVALID_URL');

  // 2. Declare the update object to be placed in the update method in the next step
  const sellerUpdateObj = {};
  for (const propertyName in req.body) {
    if (req.body[propertyName] !== undefined)
      sellerUpdateObj[`sellers.$.${propertyName}`] = req.body[propertyName];
  }

  // 3. Update the car seller in the database
  const updatedCar = await Car.findOneAndUpdate(
    {
      _id: carId,
      'sellers._id': sellerId,
    },
    sellerUpdateObj,
    {
      new: true,
      runValidators: true,
    }
  );

  // 4. Check if the car or seller have not been found
  if (!updatedCar) {
    const isCarExisted = await Car.exists({ _id: carId });
    if (!isCarExisted) throw new OperationalError('CAR_NOT_FOUND');
    else throw new OperationalError('SELLER_NOT_FOUND');
  }

  // 5. Fetch the newly updated seller to send it to the client
  const updatedSeller = updatedCar.findSellerById(sellerId);

  // 6. Send the proper response to the client
  res.status(200).json({
    status: 'success',
    data: {
      seller: updatedSeller,
    },
  });
});

// Functions used in the middlewares
function areIdsValid(...idArr) {
  for (const id of idArr)
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
  return true;
}

function handleCarDuplicateError(err) {
  const uniqueProperties = err.keyValue;
  const revisedErr = new OperationalError('DUPLICATE_KEY');
  revisedErr.errors = [];

  if (
    Object.keys(uniqueProperties).length === 3 &&
    'manufacturer' in uniqueProperties &&
    'model' in uniqueProperties &&
    'releaseYear' in uniqueProperties
  ) {
    const message = `The car "${uniqueProperties.manufacturer} ${uniqueProperties.model} ${uniqueProperties.releaseYear}" already exists.`;
    revisedErr.errors.push({
      isCompound: true,
      uniqueFields: ['manufacturer', 'model', 'releaseYear'],
      message,
    });
  }

  return revisedErr;
}
