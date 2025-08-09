const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a better splash screen for the dating app
async function createSplashScreen() {
  try {
    // Create a 1242x2688 splash screen (iPhone X resolution)
    const width = 1242;
    const height = 2688;
    
    // Create background with your app's color (#1a1a1a)
    const background = {
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 26, g: 26, b: 26, alpha: 1 } // #1a1a1a
      }
    };
    
    // Create the splash image
    const splash = sharp({
      ...background
    });
    
    // If logo exists, composite it in the center
    const logoPath = path.join(__dirname, 'assets', 'images', 'logo.png');
    
    if (fs.existsSync(logoPath)) {
      // Resize logo to fit nicely in the splash screen
      const logo = await sharp(logoPath)
        .resize(400, 400, { fit: 'inside' })
        .png()
        .toBuffer();
      
      // Composite the logo in the center
      await splash
        .composite([{
          input: logo,
          top: Math.round((height - 400) / 2),
          left: Math.round((width - 400) / 2)
        }])
        .png()
        .toFile(path.join(__dirname, 'assets', 'images', 'splash-new.png'));
    } else {
      // If no logo, just create a solid background
      await splash
        .png()
        .toFile(path.join(__dirname, 'assets', 'images', 'splash-new.png'));
    }
    
    console.log('New splash screen created successfully!');
  } catch (error) {
    console.error('Error creating splash screen:', error);
  }
}

createSplashScreen();
