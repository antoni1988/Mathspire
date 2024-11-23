DROP DATABASE IF EXISTS math_course;
CREATE DATABASE math_course;
USE math_course;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Create prerequisites table
CREATE TABLE topic_prerequisites (
    topic_id INT,
    prerequisite_id INT,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (prerequisite_id) REFERENCES topics(id)
);

CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT,
    exercise_number INT NOT NULL,
    page_number INT NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    UNIQUE KEY topic_exercise_page (topic_id, page_number, exercise_number)
);

CREATE TABLE progress (
    user_id INT,
    exercise_id INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, exercise_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- First, insert topics
INSERT INTO topics (name, description) VALUES
('Root Operations', 'Learn about square roots, cube roots and their properties'),
('Powers and Exponents', 'Master powers, exponents and their laws'),
('Quadratic Equations', 'Solve quadratic equations using various methods'),
('Optimization Problems', 'Learn to find maximum and minimum values');

-- Then set prerequisites
INSERT INTO topic_prerequisites (topic_id, prerequisite_id) VALUES
(2, 1),  -- Powers requires Root Operations
(3, 2),  -- Quadratic Equations requires Powers
(4, 3);  -- Optimization requires Quadratic Equations

INSERT INTO exercises (topic_id, exercise_number, page_number) VALUES
-- quadratic equation
(3, 1, 1),
(3, 2, 1),
(3, 3, 1),
(3, 4, 1),
(3, 1, 2),
(3, 2, 2),
(3, 3, 2),
(3, 1, 3),
(3, 2, 3),
(3, 3, 3),
-- powers and exponents 
(2, 1, 1),
(2, 2, 1),
(2, 3, 1),
(2, 4, 1),
(2, 1, 2),
(2, 2, 2),
(2, 3, 2),
(2, 1, 3),
(2, 2, 3),
(2, 3, 3);


ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;