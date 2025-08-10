Create database University_sports_center ;
USE University_sports_center;
CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    major VARCHAR(50),
    age INT CHECK (age > 15)
);
CREATE TABLE Teams (
  team_name VARCHAR(50),
  student_id VARCHAR(20),
    PRIMARY KEY (student_id, team_name),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);
SELECT 
    students.student_id,
    first_name,
    last_name,
    major,
    age,
    team_name
FROM
    students
        JOIN
    teams ON students.student_id = teams.student_id
ORDER BY team_name;


