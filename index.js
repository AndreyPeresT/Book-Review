import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "bookdata",
    password: "128991",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// SELECT ROWS IN DATABASE

async function getBooks(int) {
    
    if(int === 1){
        const result = await db.query("SELECT * FROM books");
        return result.rows;
    } else if(int === 2){
        const result = await db.query("SELECT * FROM books ORDER BY rating DESC");
        return result.rows;
    } else if(int === 3){
        const result = await db.query("SELECT * FROM books ORDER BY name ASC");
        return result.rows;
    }
};


// GET THE INDEX PAGE AND QUERYING FOR ANY BOOK WITH A REVIEW

app.get("/",async (req, res) => {
    let books = await getBooks(1);
    res.render("index.ejs", {
        books: books
    });
});

// RENDERING THE INDEX PAGE ORDERNED BY RATING

app.post("/rating",async (req, res) => {
    let books = await getBooks(2);
    res.render("index.ejs", {
        books: books
    });
})

// RENDERING THE INDEX PAGE ORDERNED BY ASCENDENCY

app.post("/asc",async (req, res) => {
    let books = await getBooks(3);
    res.render("index.ejs", {
        books: books
    });
})

// RENDER THE SEARCH PAGE

app.post("/search",(req, res) => {
    res.render("search.ejs");
});

// SEARCH A BOOK

app.post("/getbook", async (req, res) => {
    // GET THE BOOK TITLE THEN REMOVE ANY WHITE SPACE FOR BOTH START/END TO TAKE ONLY CHAR AND
    // REPLACE THE WHITE SPACES BETWEEN THE TITLE FOR " + " SO THEN API CAN GET THE TITLE   
    const bookTitle = (req.body.book).trim();
    const bookSearch = bookTitle.replaceAll(" ","+");
    try{
        const result = await axios.get(`https://openlibrary.org/search.json?title=${bookSearch}`);
        const bookResult = result.data;
        res.render("search.ejs", { bookData : bookResult});
    } catch(err) {
        console.error(err);
    };
});

// ADD A BOOK USING THE DATA FROM THE API 

app.post("/add", (req, res) => {
    const bookTitle = req.body.bookTitle;
    const bookId = req.body.bookId;
    res.render("add.ejs", {
        title : bookTitle,
        id : bookId
    });
});

// SEND REVIEW TO DATABASE

app.post("/addReview",async (req, res) => {
    const review = req.body.yourReview;
    const rating = req.body.yourRating;
    const title = req.body.reviewTitle;
    const id = req.body.reviewId;
    try{
        await db.query("INSERT INTO books (titleId,name,review,rating) VALUES ($1, $2, $3, $4);",
        [id,title,review,rating]);
        res.redirect("/");
    } catch(err) {
        console.error(err);
    };
})

// UPDATE REVIEW FROM BOOK ADD IN THE INDEX PAGE

app.post("/update", async (req, res) => {
    const bookId = req.body.update;
    try{
        const result = await db.query("SELECT id, titleid, name FROM books WHERE id = $1",[bookId]);
        const book = result.rows[0];
        
        console.log(book)
        res.render("update.ejs", {
            book: book
        });
    } catch(err) {
        console.error(err);
    };
}); 

app.post("/updateReview", async (req, res) => {
    const updateId = req.body.updateId;
    const newReview = req.body.updateText;
    const newRating = req.body.newRating;
   
    try {
        await db.query("UPDATE books SET review = $1, rating = $2 WHERE id = $3",[newReview, newRating, updateId]);
        
        res.redirect("/");
    } catch(err) {
        console.error(err);
    };
});

// DELETE REVIEW FROM THE INDEX PAGE

app.post("/delete", async (req, res) => {
    const deleteId = req.body.delete;
    try{
        await db.query("DELETE FROM books WHERE id = $1",[deleteId]);
        res.redirect("/");
    }catch(err) {
        console.error(err);
    };
});

// SERVER START

app.listen(port,() => {
    console.log("Server started at Port: "+ port)
})