const sql = require('mssql');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 3010;

// שימוש ב-bodyParser כדי לטפל בבקשות בפורמט JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// מחרוזת חיבור לדוגמה, החליפי את הפרטים כאן בפרטים שלך מ-Somee
const config = {
    user: 'Yudi_SQLLogin_1',
    password: 'c53551nsfa',
    server: 'healthylife.mssql.somee.com',
    port: 1433,
    database: 'healthylife',
    options: {
        encrypt: false, // שחקי עם ערך זה כדי לבדוק אם חיבור מוצפן נדרש או לא
        enableArithAbort: true
    }
};


async function connectToDatabase() {
    try {
        // התחברות לבסיס הנתונים
        let pool = await sql.connect(config);
        console.log("Connected to the database successfully!");

        // ביצוע שאילתא לדוגמה
        let result = await pool.request().query('SELECT * FROM healthy_client');
        console.log(result.recordset);
        let result1 = await pool.request().query('SELECT * FROM MySugarLevel');
        console.log(result1.recordset);

        // ניתוק החיבור
        sql.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

connectToDatabase();
// הגדרת הפורט שבו האפליקציה תאזין
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});