require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer(); // Initialize multer

// MySQL connection pool setup
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
}));

// API routes
app.post('/api/requests/create', upload.none(), async (req, res) => {
    const { problem, severity, submittedBy, description } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO ServiceRequests (Problem, Severity, SubmittedBy, Description) VALUES (?, ?, ?, ?)',
            [problem, severity, submittedBy, description]
        );
        const ticketId = result.insertId;
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: process.env.EMAIL_USERNAME, // Or any other recipient
            subject: `New Request Created by ${submittedBy}`,
            text: `A new request with ID ${ticketId} has been submitted:
Problem: ${problem}
Severity: ${severity}
Description: ${description}`
        };

        await transporter.sendMail(mailOptions);
        res.status(201).json({ message: "Request created and email sent successfully", ticketId });
    } catch (error) {
        console.error('Failed to create request or send email:', error);
        res.status(500).json({ message: "Failed to create request and send email", error: error.toString() });
    }
});



// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use body-parser to parse JSON bodies and urlencoded forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure express-session for session management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'TRUE' } // for HTTPS use 'true', for HTTP 'false'
}));

// Root route that serves the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// User login route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Log the SQL query being executed and the values being passed to it
        console.log('SQL Query:', 'SELECT * FROM Users WHERE Email = ?', 'Values:', [username]);

        const [users] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [username]);

        // Log the retrieved users from the database
        console.log('Users:', users);

        // Check if user exists
        if (users.length === 0) {
            // If no user is found, respond with an error
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        const user = users[0];

        // Log the retrieved user
        console.log('User:', user);

        // Compare the provided password with the password in the database
        if (password === user.Password) {
            // If the password matches, set the session variable and redirect to the dashboard
            req.session.userId = user.UserID;
            return res.redirect('/dashboard.html');
        } else {
            // If the password does not match, respond with an error
            return res.status(401).json({ message: 'Incorrect email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Error logging in user' });
    }
});


// API route to fetch all service requests
app.get('/api/requests', async (req, res) => {
    try {
        const [requests] = await pool.query('SELECT * FROM ServiceRequests');
        res.json(requests);
    } catch (error) {
        console.error('Failed to fetch service requests:', error);
        res.status(500).json({ message: 'Failed to fetch service requests' });
    }
});

app.get('/api/requests/search', async (req, res) => {
    const { id } = req.query; // Assuming the search is by 'id' query parameter
    try {
        const [results] = await pool.query('SELECT * FROM ServiceRequests WHERE RequestID = ?', [id]);
        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ message: 'Ticket not found' });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching for ticket' });
    }
});

// API route to create a new service request
app.post('/api/requests/create',upload.none(), async (req, res) => {
    console.log(req.body);
    const problem = req.body.problem ?? null;
    const severity = req.body.severity ?? null;
    const submittedBy = req.body.submittedBy ?? null;
    const description = req.body.description ?? null;
    const priority = req.body.priority ?? null;
    const assignedTo = 'IT Helpdesk';
    const status = 'Open';
    const comment = 'In Progress';

    try {
        const [result] = await pool.execute(
            'INSERT INTO ServiceRequests (Problem, Severity, SubmittedBy, Description, Priority, AssignedTo, Status, Comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [problem, severity, submittedBy, description, priority, assignedTo, status, comment]
        );
        res.status(201).json({ message: 'New service request created successfully', requestID: result.insertId });
    } catch (error) {
        console.error('Failed to create service request:', error);
        res.status(500).json({ message: 'Failed to create service request' });
    }
});

// API route to mark a service request as resolved and update the resolution date
app.patch('/api/requests/:requestId/resolve', async (req, res) => {
    const requestId = req.params.requestId;
    const resolutionDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format as YYYY-MM-DD HH:MM:SS, suitable for MySQL

    try {
        const [result] = await pool.execute(
            'UPDATE ServiceRequests SET Status = ?, ResolutionDate = ? WHERE RequestID = ?',
            ['Resolved', resolutionDate, requestId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service request not found' });
        }
        // Include the resolution date in the response for potential client-side use
        res.json({ message: 'Service request marked as resolved.', resolutionDate: resolutionDate });
    } catch (error) {
        console.error('Failed to mark as resolved:', error);
        res.status(500).json({ message: 'Failed to mark as resolved.' });
    }
});


// API route to return a service request for review
app.patch('/api/requests/:requestId/review', async (req, res) => {
    const requestId = req.params.requestId;
    try {
        const [result] = await pool.execute(
            'UPDATE ServiceRequests SET Status = ? WHERE RequestID = ?',
            ['Under Review', requestId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service request not found' });
        }
        res.json({ message: 'Service request returned for review.' });
    } catch (error) {
        console.error('Failed to return for review:', error);
        res.status(500).json({ message: 'Failed to return for review.' });
    }
});

// API route to adjust the priority of a service request
app.patch('/api/requests/:requestId/priority', async (req, res) => { // <-- Opening brace for app.patch
    const requestId = req.params.requestId;
    const { priority } = req.body;

    try { // <-- Opening brace for try block
        const [result] = await pool.execute(
            'UPDATE ServiceRequests SET Priority = ? WHERE RequestID = ?',
            [priority, requestId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service request not found' });
        }
        res.json({ message: 'Service request priority updated successfully' });
    } catch (error) { // <-- Opening brace for catch block
        console.error('Failed to update service request priority:', error);
        res.status(500).json({ message: 'Failed to update service request priority' });
    } // <-- Closing brace for catch block
    // There may be a missing closing brace here if the error is occurring.
}); // <-- Closing brace for app.patch
// Fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM Users');
        res.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Fetch all service requests
app.get('/api/service-requests', async (req, res) => {
    try {
        const [requests] = await pool.query('SELECT * FROM ServiceRequests');
        res.json(requests);
    } catch (error) {
        console.error('Failed to fetch service requests:', error);
        res.status(500).json({ message: 'Failed to fetch service requests' });
    }
});

app.post('/api/users/add', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    try {
        const [result] = await pool.execute(
            'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'User added successfully', userId: result.insertId });
    } catch (error) {
        console.error('Failed to add user:', error);
        res.status(500).json({ message: 'Failed to add user' });
    }
});

app.delete('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [result] = await pool.execute(
            'DELETE FROM Users WHERE userId = ?',
            [userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

app.delete('/api/requests/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const [result] = await pool.execute(
            'DELETE FROM ServiceRequests WHERE requestId = ?',
            [requestId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service request not found' });
        }
        res.json({ message: 'Service request deleted successfully' });
    } catch (error) {
        console.error('Failed to delete service request:', error);
        res.status(500).json({ message: 'Failed to delete service request' });
    }
});





app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});