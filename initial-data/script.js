const Car = require('./../model/car-model');
const fs = require('fs');

let carsArr = [];

fs.readFile('./initial-data/cars.json', 'binary', async (err, data) => {
  await Car.deleteMany();
  Car.create(JSON.parse(data));
});
