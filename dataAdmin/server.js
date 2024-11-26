const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const axios = require('axios');
const path = require('path'); // הוספת מודול path

const app = express();
const PORT = 3000;

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

        res.send('הרשמה בוצעה בהצלחה!');
    } catch (error) {
        console.error(error);
        res.status(500).send('אירעה שגיאה במהלך ההרשמה.');
    } finally {
        sql.close(); // סוגר את החיבור בסיום
    }
});

// Route לטיפול בהתחברות
// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         let pool = await sql.connect(dbConfig);
//         let result = await pool.request()
//             .input('username', sql.VarChar, username)
//             .input('password', sql.VarChar, password)
//             .query('SELECT * FROM healthy_client WHERE username = @username AND password = @password');

//         if (result.recordset.length > 0) {
//            res.send('התחברת בהצלחה!');
//            // window.location.replace("/healthyPerson.html");
//         } else {
//             res.status(401).send('שם משתמש או סיסמה שגויים.');
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('אירעה שגיאה במהלך ההתחברות.');
//     } finally {
//         sql.close(); // סוגר את החיבור בסיום
//     }
// });


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


// החלף את הערכים האלו בפרטי ה-API שלך
// const apiKey = 'acc_f34f4bef20a341d';
// const apiSecret = 'e836ce528e7c781c5edf40cccee309da';
// const imageUrl = 'https://www.hakolabait.co.il/images/itempics/071160009349_05092022084352_large.jpg';  // URL של התמונה שברצונך לתייג

// async function tagImage() {
//     try {
//         const response = await axios.get('https://api.imagga.com/v2/tags', {
//             params: { image_url: imageUrl },
//             auth: {
//                 username: apiKey,
//                 password: apiSecret
//             }
//         });

//         // קבלת חמשת התגיות הראשונות
//         const topTags = response.data.result.tags.slice(0, 10);
//         console.log('עשר התגיות הראשונות:', topTags);
//         return topTags;
//     } catch (error) {
//         console.error('שגיאה בקבלת תגיות:', error.response ? error.response.data : error.message);
//     }
// }

// const topTags = tagImage();




///////////////////////////////////////////////////////////////////
// const fs = require('fs');
// // //const axios = require('axios');

// async function analyzeImage(imagePath) {
//     const apiKey = 'acc_f34f4bef20a341d';
//     const apiSecret = 'e836ce528e7c781c5edf40cccee309da';
//     const endpoint = 'https://api.imagga.com/v2/tags';

//     const image = fs.createReadStream(imagePath);

//     try {
//         const response = await axios.post(endpoint, image, {
//             auth: {
//                 username: apiKey,
//                 password: apiSecret,
//             },
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//         });

//         return response.data.result.tags.map(tag => tag.tag.en); // מחזיר את התגים
//     } catch (error) {
//         console.error('Error analyzing image:', error);
//         throw error;
//     }
// }

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

// async function processImage(imagePath) {
//     try {
//         // שלב 1: ניתוח תמונה עם Imagga
//         const tags = await analyzeImage(imagePath);
//         console.log('Identified tags:', tags);

//         // שלב 2: חיפוש פרטי מזון ב-USDA עבור כל תג
//         for (const tag of tags) {
//             const foodData = await getFoodDetails(tag);
//             if (foodData) {
//                 console.log('Food data received from USDA:', foodData);

//                 // כאן, אנחנו מדפיסים את המידע התזונתי שמתקבל מ-USDA
//                 console.log(`Food Name: ${foodData.description}`);
//                 console.log(`Calories: ${foodData.foodNutrients.find(n => n.nutrientName === 'Energy').value}`);
//                 console.log(`Protein: ${foodData.foodNutrients.find(n => n.nutrientName === 'Protein').value}`);
//                 console.log(`Fat: ${foodData.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)').value}`);
//                 break; // מפסיקים אחרי שמצאנו את המוצר הראשון
//             }
//         }
//     } catch (error) {
//         console.error('Error processing image:', error);
//     }
// }

// // קריאה לפונקציה עם נתיב לתמונה
// processImage("C:/Users/linoi/OneDrive/שולחן העבודה/food.jpg");

// const apiKey1 = 'y5z1udhUMKIhsNvDikOZNh0K1Ankvj3oC3iEJ25q';
// const apiUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodTag}&api_key=${usdaConfig.apiKey}`'; // החלף בכתובת ה-API המתאימה

// async function getUSDAData() {
//     try {
//         const response = await axios.get(apiUrl, {
//             headers: {
//                 'Authorization': `Bearer ${apiKey1}`
//             }
//         });
//         console.log(response.data); // הצגת התשובה שהתקבלה
//     } catch (error) {
//         console.error('שגיאה בעת שליחת הבקשה:', error);
//     }
// }

// getUSDAData();

// const apiKey2 = 'y5z1udhUMKIhsNvDikOZNh0K1Ankvj3oC3iEJ25q';  // הכנס כאן את מפתח ה-API שלך
// const query = 'Chicken Salad';   // המרכיב או סוג המזון שתרצה לחפש
// const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&api_key=${apiKey}`;

// axios.get(url)
//   .then(response => {
//     console.log(response.data);
//   })
//   .catch(error => {
//     console.error('Error fetching data:', error);
//   });
async function checkHebrewDate(date) {
    try {
        const response = await axios.get(`https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth() + 1}&gd=${date.getDate()}&g2h=1`);
        const hebcalData = response.data;

        // בדיקת סוג היום
        if (hebcalData.events.includes("Shabbat")) {
            console.log("שבת");
        } else if (hebcalData.events.some(event => event.includes("Holiday"))) {
            console.log("חג יהודי");
        } else {
            console.log("יום חול");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

checkHebrewDate(new Date("2024-10-02"));

/////////////////////////////Database
// שמירת נתונים לטבלת MySugarLevel
app.post('/addMeal', (req, res) => {
    const { username, dateOfmeal, moment, meal, sugarlevel, isHag } = req.body;

    if (!username || !dateOfmeal || !moment || !meal || !sugarlevel) {
        return res.status(400).send('All fields are required!');
    }

    const sql = `
      INSERT INTO MySugarLevel (username, dateOfmeal, moment, meal, sugarlevel, isHag)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [username, dateOfmeal, moment, meal, sugarlevel, isHag], function (err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.status(500).send('Error saving meal data.');
        }
        // תגובה עם מזהה השורה שהתווספה
        res.status(201).send({ message: 'Meal data added successfully!', id: this.lastID });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


