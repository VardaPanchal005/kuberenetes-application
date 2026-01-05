const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient } = require('mongodb');
const escape = require('escape-html');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Middleware to parse JSON data from requests
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection details
const mongoUrl = process.env.DB_URL || 'mongodb://admin:password@mongodb-service:27017';
const dbName = 'newdatabase'; // Database name
const collectionName = 'mycollection'; // Collection name

let db, collection;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    collection = db.collection(collectionName);
  })
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Sample profile data
let profile = {
  name: 'varda',
  email: 'vardapanchal@gmail.com',
  interests: 'nothing',
};

// GET request to display the profile
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Profile</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1>User profile</h1>
      <img src="/image.png" class="profile-picture">
      <div class="info">Name:<strong><span>${escape(profile.name)}</span></strong></div>
      <hr>
      <div class="info">Email:<strong><span>${escape(profile.email)}</span></strong></div>
      <hr>
      <div class="info">Interests:<strong><span>${escape(profile.interests)}</span></strong></div>
      <hr>
      <form action="/edit" method="GET">
        <button type="submit">Edit Profile</button>
      </form>
    </body>
    </html>
  `);
});

// GET request to show the edit form
app.get('/edit', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Edit Profile</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1>Edit Profile</h1>
      <form action="/update-profile" method="POST">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" value="${escape(profile.name)}" required>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" value="${escape(profile.email)}" required>
        <label for="interests">Interests:</label>
        <input type="text" id="interests" name="interests" value="${escape(profile.interests)}" required>
        <button type="submit">Update Profile</button>
      </form>
    </body>
    </html>
  `);
});

// POST request to update the profile and save to MongoDB
app.post('/update-profile', async (req, res) => {
  try {
    profile.name = req.body.name;
    profile.email = req.body.email;
    profile.interests = req.body.interests;

    // Insert profile into MongoDB
    const result = await collection.insertOne(profile);

    console.log('Profile saved to MongoDB:', result.insertedId);
    res.redirect('/');
  } catch (err) {
    console.error('Error saving profile to MongoDB:', err);
    res.status(500).send('Error saving profile');
  }
});

// POST request to handle arbitrary data storage
app.post('/data', async (req, res) => {
  try {
    const data = req.body; // Capture data from request body
    const result = await collection.insertOne(data); // Insert into MongoDB

    console.log('Data inserted into MongoDB:', result.insertedId);
    res.status(201).json({ message: 'Data inserted successfully', id: result.insertedId });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ message: 'Failed to insert data', error: err.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
