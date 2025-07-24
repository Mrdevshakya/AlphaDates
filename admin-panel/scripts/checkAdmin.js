const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
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

async function checkAdminUser(email) {
  try {
    // Check if user exists in Auth
    const userRecord = await getAuth().getUserByEmail(email);
    console.log('\nFirebase Auth User Status:');
    console.log('------------------------');
    console.log('User exists in Auth:', !!userRecord);
    console.log('User ID:', userRecord.uid);
    console.log('Email verified:', userRecord.emailVerified);
    console.log('Disabled:', userRecord.disabled);

    // Check if user exists in admins collection
    const adminDoc = await getFirestore().collection('admins').doc(userRecord.uid).get();
    console.log('\nFirestore Admin Status:');
    console.log('---------------------');
    console.log('User exists in admins collection:', adminDoc.exists);
    if (adminDoc.exists) {
      console.log('Admin data:', adminDoc.data());
    }
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('User does not exist in Firebase Auth');
    } else {
      console.error('Error checking admin user:', error);
    }
  }
  process.exit();
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide email as an argument');
  console.log('Usage: node checkAdmin.js <email>');
  process.exit(1);
}

checkAdminUser(email); 