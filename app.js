// index.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./model/User');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://Sameer:beZdmx5TeDMLDV5@cluster0.rubvk.mongodb.net/StartUp1?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

app.use(bodyParser.json());

// Route to register a new user and generate a JWT token
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if a user with the same email already exists
    console.log(req.body)
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return res.status(400).json({ error: 'Email already exists' });
    // }

    // // Create a new user
    // const user = new User({ name, email, password });

    // // Hash the password before saving
    // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(password, salt);

    // // Save the user to the database
    // await user.save();

    // // Generate a JWT token for the user
    // const token = jwt.sign({ _id: user._id }, 'your-secret-key'); // Replace with your own secret key

    // res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Route to authenticate a user and generate a JWT token
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ _id: user._id }, 'your-secret-key'); // Replace with your own secret key

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
