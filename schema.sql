DROP DATABASE IF EXISTS math_course;
CREATE DATABASE math_course;
USE math_course;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
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
    exercise_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    UNIQUE KEY topic_exercise (topic_id, exercise_number, exercise_type)
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

-- Finally, insert exercises
INSERT INTO exercises (topic_id, exercise_number, exercise_type) VALUES
-- Basic exercises
(3, 1, 'basic'),
(3, 2, 'basic'),
(3, 3, 'basic'),
(3, 4, 'basic'),
-- Factoring exercises
(3, 1, 'factoring'),  -- x² - 4x + 4
(3, 2, 'factoring'),  -- x² + 6x + 9
(3, 3, 'factoring'),  -- x² - 9
(3, 4, 'factoring'),  -- x² - 2x - 8
(3, 5, 'factoring'),  -- x² + 7x + 12
-- Word problem exercises
(3, 1, 'word_problems'),
(3, 2, 'word_problems'),
(3, 3, 'word_problems');
