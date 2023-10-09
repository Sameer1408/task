const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 4000; // Set the port for your server
const Task = require('./model/Task')
const User = require('./model/User')
const db = require('./db');
const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const corsOptions = {
    origin: '*', // Replace '*' with specific origin(s) you want to allow
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const jwtOptions = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'abcdefghijklmnopqrstuvwxyz',
};

passport.use(
    new jwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await User.findById(payload._id);
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    })
);

// Route to register a new user and generate a JWT token
app.post('/signup', async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(200).json({success:false, message: 'User already exists' });
        }
        const user = new User({ name, email, password });
        const savedUser  = await user.save();
        const token = user.generateAuthToken();

        res.status(201).json({ success:true,message: 'User registered successfully', token ,savedUser});
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Route to login user
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email,password);
        const user = await User.findOne({ email });
        if (!user) {
            console.log("1")
            return res.status(200).json({success:false,message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("2")
            return res.status(200).json({success:false,message: 'Invalid email or password'});
        }

        // Generate a JWT token for the user
        const token = jwt.sign({ _id: user._id }, 'abcdefghijklmnopqrstuvwxyz'); // Replace with your own secret key

        res.status(200).json({success:true, message: 'Login successful', token ,user});
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getUser',passport.authenticate('jwt', { session: false }),async(req,res)=>{
   const userId = req.user._id;
   const user = await User.findById(userId);
   res.status(200).json(user);
})

//Route to create new task
app.post(
    '/createTask',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const { title, description } = req.body;
            if(title=="")
            {
                res.status(500).json({success:false,message:"Title is Required",task});
            }
            if(description=="")
            {
                res.status(500).json({success:false,message:"Description is Required",task});
            }
            const task = new Task({
                title,
                description,
                userId: req.user._id, // Associate the task with the user
            });
            await task.save();
            res.status(201).json({success:true,message:"Task Created Successfully",task});
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

app.get(
    '/allTasks',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            // Find all tasks associated with the logged-in user
            const tasks = await Task.find({ userId: req.user._id });
            res.status(200).json(tasks);
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

app.put(
    '/tasks/:taskId',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const { title, description } = req.body;
            const { taskId } = req.params;

            // Find the task by ID and check if it belongs to the logged-in user
            const task = await Task.findOne({ _id: taskId, userId: req.user._id });
            if (!task) {
                return res.status(404).json({success:false, message: 'Task not found' });
            }
            // Update the task properties and save it
            task.title = title || task.title;
            task.description = description || task.description;
            await task.save();
            res.status(200).json({success:true,message:'Task Updated',task});
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

app.delete(
    '/tasks/:taskId',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const { taskId } = req.params;

            const task = await Task.findOneAndDelete({ _id: taskId, userId: req.user._id });
            res.status(204).send(); // No content response for successful deletion
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

db.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});