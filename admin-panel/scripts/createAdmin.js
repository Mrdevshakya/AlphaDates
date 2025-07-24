const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin with the new service account key
const serviceAccount = require(path.join(__dirname, '../../afnny-ed7bb-firebase-adminsdk-fbsvc-1cf581fe3b.json'));

try {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

async function createAdminUser(email, password) {
  try {
    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    // Add user to admins collection in Firestore
    await getFirestore().collection('admins').doc(userRecord.uid).set({
      email: email,
      role: 'admin',
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    console.log('Successfully created admin user:', userRecord.uid);
    console.log('Email:', email);
    console.log('Please save these credentials securely.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'auth/email-already-exists') {
      console.log('This email is already registered. If you need to reset the password, please use the password reset function.');
    }
  }
  process.exit();
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Please provide email and password as arguments');
  console.log('Usage: node createAdmin.js <email> <password>');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.error('Password must be at least 8 characters long');
  process.exit(1);
}

createAdminUser(email, password); 