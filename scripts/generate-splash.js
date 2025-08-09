const fs = require('fs');
const path = require('path');

// Create splash screen as a simple SVG file
const splashSvg = `
<svg width="1242" height="2688" viewBox="0 0 1242 2688" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2688" fill="#1a1a1a"/>
  <g transform="translate(621, 1000)">
    <text x="0" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#FF6B6B">
      Alpha
    </text>
    <text x="0" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#FF8E53">
      Dates
    </text>
    <text x="0" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#FFFFFF" opacity="0.8">
      Find your perfect match
    </text>
  </g>
</svg>
`;

// Create the splash.png file from SVG
const splashPath = path.join(__dirname, '..', 'assets', 'images', 'splash.png');

// For now, we'll create a simple placeholder PNG by converting the SVG to a data URL
// In a real implementation, you would use a library like sharp to convert SVG to PNG

// Write SVG to file first
const svgPath = path.join(__dirname, '..', 'assets', 'images', 'splash.svg');
fs.writeFileSync(svgPath, splashSvg);

console.log('Created splash screen assets:');
console.log('- splash.svg (vector version)');
console.log('- For splash.png, please convert the SVG using a tool like Sharp or online converters');
console.log('');
console.log('To convert SVG to PNG, you can use:');
console.log('1. Online converters like https://svgtopng.com/');
console.log('2. Command line tools like ImageMagick: convert splash.svg splash.png');
console.log('3. Node.js libraries like Sharp (after installation)');
