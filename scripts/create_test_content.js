const admin = require('firebase-admin');
const serviceAccount = require('../afnny-ed7bb-firebase-adminsdk-fbsvc-c34f8e28af.json');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Sample image URLs for posts and stories
const sampleImages = [
  'https://source.unsplash.com/random/800x800?dating,couple',
  'https://source.unsplash.com/random/800x800?love',
  'https://source.unsplash.com/random/800x800?relationship',
  'https://source.unsplash.com/random/800x800?romance',
  'https://source.unsplash.com/random/800x800?friends',
  'https://source.unsplash.com/random/800x800?party',
  'https://source.unsplash.com/random/800x800?travel',
  'https://source.unsplash.com/random/800x800?food',
  'https://source.unsplash.com/random/800x800?coffee',
  'https://source.unsplash.com/random/800x800?nature'
];

// Sample captions for posts
const sampleCaptions = [
  "Living my best life! 💫",
  "Perfect day with perfect company ❤️",
  "Weekend vibes 🌟",
  "Making memories 📸",
  "Can't get enough of these moments 🥰",
  "Adventure awaits! 🌎",
  "Coffee and conversations ☕",
  "Just another day in paradise 🌴",
  "Feeling blessed 🙏",
  "Good times and tan lines 🌞"
];

// Sample locations
const sampleLocations = [
  "New York, NY",
  "Los Angeles, CA",
  "Paris, France",
  "London, UK",
  "Tokyo, Japan",
  "Sydney, Australia",
  "Dubai, UAE",
  "Singapore",
  "Mumbai, India",
  "Toronto, Canada"
];

async function createTestContent() {
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Create posts and stories for each user
    for (const user of users) {
      console.log(`Creating content for user: ${user.name}`);

      // Create 5 random posts
      for (let i = 0; i < 5; i++) {
        const postData = {
          userId: user.id,
          caption: sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)],
          mediaUrls: [
            sampleImages[Math.floor(Math.random() * sampleImages.length)],
            // Randomly add a second image to some posts
            Math.random() > 0.7 ? sampleImages[Math.floor(Math.random() * sampleImages.length)] : null
          ].filter(Boolean), // Remove null values
          type: 'image',
          likes: [],
          comments: [],
          location: Math.random() > 0.5 ? sampleLocations[Math.floor(Math.random() * sampleLocations.length)] : null,
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random time within last 7 days
          )
        };

        // Add random likes from followers
        user.followers.forEach(followerId => {
          if (Math.random() > 0.5) {
            postData.likes.push(followerId);
          }
        });

        // Add random comments from followers
        user.followers.forEach(followerId => {
          if (Math.random() > 0.7) {
            postData.comments.push({
              id: Date.now().toString() + Math.random().toString(),
              userId: followerId,
              text: "Love this! 😍",
              createdAt: admin.firestore.Timestamp.fromDate(new Date()),
              likes: []
            });
          }
        });

        await db.collection('posts').add(postData);
        console.log(`Created post ${i + 1}/5 for ${user.name}`);
      }

      // Create 2 stories
      for (let i = 0; i < 2; i++) {
        const storyData = {
          userId: user.id,
          mediaUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)],
          type: 'image',
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)) // Random time within last 24 hours
          ),
          seenBy: []
        };

        // Add random views from followers
        user.followers.forEach(followerId => {
          if (Math.random() > 0.3) {
            storyData.seenBy.push(followerId);
          }
        });

        await db.collection('stories').add(storyData);
        console.log(`Created story ${i + 1}/2 for ${user.name}`);
      }

      // Update user's posts count
      await db.collection('users').doc(user.id).update({
        posts: admin.firestore.FieldValue.increment(5)
      });
    }

    console.log('All test content created successfully!');
  } catch (error) {
    console.error('Error creating test content:', error);
  }
}

createTestContent()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 