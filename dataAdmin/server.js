const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const axios = require('axios');
const path = require('path'); // הוספת מודול path

const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware לפענוח JSON
const session = require('express-session');

app.use(session({
    secret: 'mySecretKey', // מפתח סודי לחתימה על ה-Session
    resave: false,         // לא לשמור Session אם לא היה שינוי
    saveUninitialized: true, // לשמור Session ריק
    cookie: { secure: false } // עבור HTTP רגיל; במצב HTTPS יש להגדיר ל-true
}));


// קונפיגורציה לבסיס הנתונים
const dbConfig = {
    user: 'Yudi_SQLLogin_1',
    password: 'c53551nsfa',
    server: 'healthylife.mssql.somee.com',
    port: 1433,
    database: 'healthylife',
    options: {
        encrypt: false, // בדקי אם נדרש
        enableArithAbort: true
    }
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public'))); // משרת את קבצי ה-HTML וה-CSS

// Route לדף הבית
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'healthyLife.html'));
});

// Route לטיפול בהרשמה
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('INSERT INTO healthy_client (username, email, password) VALUES (@username, @email, @password)');
        // שליחת הודעה + ניתוב לדף
        res.status(200).send(`
    <script>
        alert('הרשמה בוצעה בהצלחה!');
        window.location.href = '/login.html';
    </script>
         `);
        //res.send('הרשמה בוצעה בהצלחה!');
    } catch (error) {
        console.error(error);
        res.status(500).send('אירעה שגיאה במהלך ההרשמה.');
    } finally {
        sql.close(); // סוגר את החיבור בסיום
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Received username:', username);

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query('SELECT * FROM healthy_client WHERE username = @username AND password = @password');

        if (result.recordset.length > 0) {
            req.session.username = username; // שמירת שם המשתמש ב-session
            res.redirect(`/healthyPerson.html?username=${encodeURIComponent(username)}`); // מעבר לדף החדש
        } else {
            res.status(401).send('שם משתמש או סיסמה שגויים.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('אירעה שגיאה במהלך ההתחברות.');
    }
});

// נקודת קצה להחזיר את שם המשתמש ללקוח
app.get('/getUsername', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).send('משתמש לא מחובר.');
    }
});

async function getFoodDetails(foodItem) {
    const apiKey = 'y5z1udhUMKIhsNvDikOZNh0K1Ankvj3oC3iEJ25';  // מפתח ה-API שלך
    const endpoint = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodItem}&api_key=${apiKey}`;

    try {
        const response = await axios.get(endpoint);
        return response.data.foods[0]; // מחזיר את המוצר הראשון שנמצא
    } catch (error) {
        console.error('Error fetching food details:', error);
        throw error;
    }
}


app.post('/addMeal', async (req, res) => {
    const { username, dateOfmeal, moment, meal, sugarlevel, isHag } = req.body;

    console.log("data recievd: ", username, dateOfmeal, moment, meal, sugarlevel, isHag);

    if (!username || !dateOfmeal || !moment || !meal || !sugarlevel) {
        if (sugarlevel !== 0) {
            return res.status(400).send("All fields are required!");
        }
    }

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('dateOfmeal', sql.Date, dateOfmeal)
            .input('moment', sql.VarChar, moment)
            .input('meal', sql.VarChar, meal)
            .input('sugarlevel', sql.Float, sugarlevel)
            .input('isHag', sql.Bit, isHag)
            .query('INSERT INTO MySugarLevel (username, dateOfmeal, moment, meal, sugarlevel, isHag) VALUES (@username, @dateOfmeal, @moment, @meal, @sugarlevel, @isHag)');
        res.status(201).send('Data saved successfully.');
    } catch (error) {
        console.error("Database error: ", error);
        res.status(500).send('Error saving data to database.');
    } finally {
        sql.close(); // סוגר את החיבור בסיום
    }
});

// פונקציה לשליפת נתונים
async function fetchData() {
    try {
        // יצירת חיבור ל-SQL Server
        let pool = await sql.connect(dbConfig);

        // ביצוע שאילתה לשליפת כל הנתונים מהטבלה
        let result = await pool.request().query('SELECT * FROM MySugarLevel');

        console.log('Data fetched successfully:', result.recordset);

        // סיום החיבור
        sql.close();
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

fetchData();


app.get('/getUserData', async (req, res) => {
    const username = req.query.username; // קבלת שם המשתמש מהבקשה

    if (!username) {
        return res.status(400).send({ error: 'Username is required' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.VarChar, username) // הכנסת הפרמטר לשאילתה
            .query('SELECT dateOfmeal, sugarlevel FROM MySugarLevel WHERE username = @username');

        res.send(result.recordset); // החזרת התוצאות ללקוח
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).send({ error: 'Failed to fetch data' });
    } finally {
        sql.close();
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


