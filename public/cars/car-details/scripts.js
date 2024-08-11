// Function to fetch car details and display them
async function fetchCarDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id'); // Extract the 'id' query parameter
  console.log(carId);
  try {
    // Fetch data from the API
    const response = await fetch(`http://127.0.0.1:3000/api/v1/cars/${carId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Get token from localStorage
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch data');
    }

    const car = data.data.car;

    // Populate the car details
    document.getElementById('car-image').src = car.image;
    document.getElementById('car-manufacturer').textContent = car.manufacturer;
    document.getElementById('car-model').textContent = car.model;
    document.getElementById(
      'car-release-year'
    ).innerHTML = `Release Year: <strong>${car.releaseYear}</strong>`;
    document.getElementById(
      'car-rating'
    ).innerHTML = `Rating: ${car.ratingsAverage} <span class="star">★</span>`;
    document.getElementById(
      'car-starting-price'
    ).textContent = `Starting at: ${car.minPrice}$`;

    // Populate the sellers
    const sellersContainer = document.getElementById('sellers-container');
    sellersContainer.innerHTML = '';

    car.sellers.forEach((seller) => {
      const sellerDiv = document.createElement('div');
      sellerDiv.className = 'seller';

      sellerDiv.innerHTML = `
        <div class="seller-info">
          <p><strong>${seller.storeName}</strong></p>
          <p>${seller.location}</p>
        </div>
        <div>
          <p>${seller.price}$</p>
          ${
            seller.website
              ? `<a href="${seller.website}" target="_blank">${seller.website}</a>`
              : `<p>${seller.telNumber}</p>`
          }
        </div>
      `;

      sellersContainer.appendChild(sellerDiv);
    });
  } catch (error) {
    console.error('Error fetching car details:', error);
  }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', fetchCarDetails);
