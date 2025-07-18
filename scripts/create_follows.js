const admin = require('firebase-admin');
const serviceAccount = require('../afnny-ed7bb-firebase-adminsdk-fbsvc-c34f8e28af.json');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createFollowConnections() {
  try {
    // Get all test users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Create follow connections between all users
    for (const user of users) {
      const otherUsers = users.filter(u => u.id !== user.id);
      
      // Update current user's following list
      await db.collection('users').doc(user.id).update({
        following: admin.firestore.FieldValue.arrayUnion(...otherUsers.map(u => u.id))
      });

      // Update other users' followers lists
      for (const otherUser of otherUsers) {
        await db.collection('users').doc(otherUser.id).update({
          followers: admin.firestore.FieldValue.arrayUnion(user.id)
        });
      }

      console.log(`Created follow connections for ${user.name}`);
    }

    console.log('All follow connections created successfully!');
  } catch (error) {
    console.error('Error creating follow connections:', error);
  }
}

createFollowConnections()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 