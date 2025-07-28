import axios from 'axios';

const API_URL = 'https://neuronerdsquiz.onrender.com/api/test';

axios.get(API_URL)
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
