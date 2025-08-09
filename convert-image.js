const sharp = require('sharp');
const fs = require('fs');

// Convert logo.jpg to logo.png
sharp('assets/images/logo.jpg')
  .png()
  .toFile('assets/images/logo.png')
  .then(() => {
    console.log('logo.jpg converted to logo.png successfully');
  })
  .catch(err => {
    console.error('Error converting image:', err);
  });
