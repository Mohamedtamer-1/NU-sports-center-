CREATE DATABASE StudentMedicalRecords;
USE StudentMedicalRecords;

-- Main student information (required fields)
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    college VARCHAR(100) NOT NULL,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    signature_name VARCHAR(100) NOT NULL,
    agreement_accepted BOOLEAN NOT NULL 
);

-- Medical conditions (text input when yes)
CREATE TABLE medical_conditions (
    condition_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    has_conditions BOOLEAN NOT NULL DEFAULT FALSE,
    conditions_description TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Surgical history (text input when yes)
CREATE TABLE surgeries (
    surgery_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    has_surgeries BOOLEAN NOT NULL DEFAULT FALSE,
    surgeries_description TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Specific conditions (yes/no with optional text)
CREATE TABLE specific_conditions (
    condition_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    has_diabetes BOOLEAN NOT NULL DEFAULT FALSE,
    has_high_bp BOOLEAN NOT NULL DEFAULT FALSE,
    has_heart_disease BOOLEAN NOT NULL DEFAULT FALSE,
    heart_disease_description TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Injuries and habits (yes/no with optional text)
CREATE TABLE injuries_habits (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    has_spinal_injuries BOOLEAN NOT NULL DEFAULT FALSE,
    is_smoker BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Medications (text input when yes)
CREATE TABLE medications (
    medication_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    takes_medications BOOLEAN NOT NULL DEFAULT FALSE,
    medications_list TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Sports activities (text input when yes)
CREATE TABLE sports (
    sport_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    practices_sports BOOLEAN NOT NULL DEFAULT FALSE,
    sports_description TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);
SELECT 
    s.student_id,
    s.full_name,
    s.college,
    s.id_number,
    s.phone_number,
    
    -- Medical conditions
    mc.has_conditions,
    mc.conditions_description,
    
    -- Surgical history
    su.has_surgeries,
    su.surgeries_description,
    
    -- Specific conditions
    sc.has_diabetes,
    sc.has_high_bp,
    sc.has_heart_disease,
    sc.heart_disease_description,
    
    -- Injuries and habits
    ih.has_spinal_injuries,
    ih.is_smoker,
    
    -- Medications
    md.takes_medications,
    md.medications_list,
    
    -- Sports
    sp.practices_sports,
    sp.sports_description,
    
    -- Agreement
    s.signature_name,
    s.agreement_accepted
FROM 
    students s
LEFT JOIN medical_conditions mc ON s.student_id = mc.student_id
LEFT JOIN surgeries su ON s.student_id = su.student_id
LEFT JOIN specific_conditions sc ON s.student_id = sc.student_id
LEFT JOIN injuries_habits ih ON s.student_id = ih.student_id
LEFT JOIN medications md ON s.student_id = md.student_id
LEFT JOIN sports sp ON s.student_id = sp.student_id;
