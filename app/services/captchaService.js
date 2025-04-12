// CAPTCHA service for login security
const svgCaptcha = require('svg-captcha');

// Generate a simple text CAPTCHA
function generateCaptcha() {
  // Create a CAPTCHA with options
  const captcha = svgCaptcha.create({
    size: 4, // number of characters
    ignoreChars: '0o1il', // characters to exclude
    noise: 2, // number of noise lines
    color: true, // colors
    background: '#f0f0f0', // background color
    width: 150,
    height: 50,
    fontSize: 50
  });
  
  return {
    text: captcha.text, // the text of the CAPTCHA
    svg: captcha.data // SVG string
  };
}

module.exports = {
  generateCaptcha
};
