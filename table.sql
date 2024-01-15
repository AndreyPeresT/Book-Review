CREATE TABLE books 
(
    id SERIAL PRIMARY KEY,
    titleid integer NOT NULL,
    name varchar(45) NOT NULL,
    review text NOT NULL,
    rating integer NOT NULL
);