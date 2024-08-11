// Function to fetch car models and display them
async function fetchCarModels() {
  // Retrieve the token from localStorage
  const token = localStorage.getItem('authToken');

  // Extract query parameters from the current URL
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = urlParams.toString();

  try {
    // Fetch data from the API with query parameters
    const response = await fetch(`/api/v1/cars?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, // Attach the token
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch data');
    }

    const carGrid = document.getElementById('car-grid');
    carGrid.innerHTML = ''; // Clear existing content

    data.data.cars.forEach((car) => {
      const carsDiv = document.createElement('div');
      carsDiv.className = 'car-model';
      carsDiv.onclick = () =>
        (window.location.href = `/cars/car-details?id=${car._id}`);

      carsDiv.innerHTML = `
        <img src="${car.image}" alt="${car.model}">
        <div class="car-info">
          <h2>${car.manufacturer}</h2>
          <p>${car.model}</p>
          <p>${car.releaseYear}</p>
          <p>Starts at ${car.minPrice || 'N/A'}</p>
          <p>Ratings: ${car.ratingsAverage || 'N/A'}</p>
        </div>
      `;

      carGrid.appendChild(carsDiv);
    });
  } catch (error) {
    console.error('Error fetching car models:', error);
  }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', fetchCarModels);
