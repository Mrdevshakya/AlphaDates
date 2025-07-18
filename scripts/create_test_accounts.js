const admin = require('firebase-admin');
const serviceAccount = require('../afnny-ed7bb-firebase-adminsdk-fbsvc-c34f8e28af.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Test accounts data
const testAccounts = [
  {
    name: "Alex Thompson",
    email: "alex.test@example.com",
    mobileNumber: "1234567890",
    password: "Test@123",
    username: "alex_test"
  },
  {
    name: "Sarah Wilson",
    email: "sarah.test@example.com",
    mobileNumber: "2345678901",
    password: "Test@123",
    username: "sarah_test"
  },
  {
    name: "Michael Chen",
    email: "michael.test@example.com",
    mobileNumber: "3456789012",
    password: "Test@123",
    username: "michael_test"
  },
  {
    name: "Emma Davis",
    email: "emma.test@example.com",
    mobileNumber: "4567890123",
    password: "Test@123",
    username: "emma_test"
  },
  {
    name: "James Rodriguez",
    email: "james.test@example.com",
    mobileNumber: "5678901234",
    password: "Test@123",
    username: "james_test"
  },
  {
    name: "Olivia Brown",
    email: "olivia.test@example.com",
    mobileNumber: "6789012345",
    password: "Test@123",
    username: "olivia_test"
  },
  {
    name: "William Lee",
    email: "william.test@example.com",
    mobileNumber: "7890123456",
    password: "Test@123",
    username: "william_test"
  },
  {
    name: "Sophia Patel",
    email: "sophia.test@example.com",
    mobileNumber: "8901234567",
    password: "Test@123",
    username: "sophia_test"
  },
  {
    name: "Daniel Kim",
    email: "daniel.test@example.com",
    mobileNumber: "9012345678",
    password: "Test@123",
    username: "daniel_test"
  },
  {
    name: "Isabella Garcia",
    email: "isabella.test@example.com",
    mobileNumber: "0123456789",
    password: "Test@123",
    username: "isabella_test"
  }
];

async function createTestAccounts() {
  for (const account of testAccounts) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.name,
      });

      // Create user profile in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name: account.name,
        email: account.email,
        mobileNumber: account.mobileNumber,
        username: account.username,
        displayName: account.name,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=random`,
        bio: `Test account for ${account.name}`,
        followers: [],
        following: [],
        isPrivate: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Created test account for ${account.name} (${userRecord.uid})`);
    } catch (error) {
      console.error(`Error creating account for ${account.name}:`, error);
    }
  }
}

createTestAccounts()
  .then(() => {
    console.log('All test accounts created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating test accounts:', error);
    process.exit(1);
  }); 