const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(".")) // Serve static files from current directory

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "NUscDB23",
  password: "23100019@NUdb",
}

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "abcd1234",
  multipleStatements: true,
}

// Create database connections with error handling
function createDbConnection(database) {
  const connection = mysql.createConnection({
    ...dbConfig,
    database,
  })

  connection.connect((err) => {
    if (err) {
      console.error(`❌ Error connecting to ${database} DB:`, err.message)
      setTimeout(() => createDbConnection(database), 5000)
      return
    }
    console.log(`✅ Connected to ${database} DB`)
  })

  connection.on("error", (err) => {
    console.error(`Database error (${database}):`, err)
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      createDbConnection(database)
    } else {
      throw err
    }
  })

  return connection
}

// Create database connections
const footballDb = createDbConnection("University_sports_center")
const medicalDb = createDbConnection("StudentMedicalRecords")

// Helper function for database queries
const query = (db, sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) {
        console.error("Database query error:", {
          sql: sql,
          values: values,
          error: err,
        })
        return reject(err)
      }
      resolve(results)
    })
  })
}

// Validate required fields middleware
const validateMedicalForm = (req, res, next) => {
  const requiredFields = ["full_name", "college", "id_number", "phone_number", "signature_name"]
  const missingFields = requiredFields.filter((field) => !req.body[field])

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      missing: missingFields,
    })
  }

  if (!req.body.agreement_accepted) {
    return res.status(400).json({
      error: "You must accept the agreement",
    })
  }

  next()
}

// === ADMIN ROUTES ===

// Admin login route
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({
      success: true,
      message: "Login successful",
      redirectUrl: "/admin/dashboard",
    })
  } else {
    res.status(401).json({
      success: false,
      message: "Access denied",
    })
  }
})

// Admin dashboard route - serves the dashboard HTML
app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-dashboard.html"))
})

// Admin data API route
app.get("/admin/data", async (req, res) => {
  try {
    // Get football tournament data
    const footballStudents = await query(
      footballDb,
      `
        SELECT s.student_id, s.first_name, s.last_name, s.major, s.age, t.team_name
        FROM Students s 
        LEFT JOIN Teams t ON s.student_id = t.student_id 
        ORDER BY s.student_id DESC
    `,
    )

    // Get medical form data
    const medicalStudents = await query(
      medicalDb,
      `
        SELECT 
            s.student_id as id, s.full_name, s.college, s.id_number, s.phone_number, s.signature_name,
            mc.has_conditions, mc.conditions_description,
            sur.has_surgeries, sur.surgeries_description,
            sc.has_diabetes, sc.has_high_bp, sc.has_heart_disease, sc.heart_disease_description,
            ih.has_spinal_injuries, ih.is_smoker,
            med.takes_medications, med.medications_list,
            sp.practices_sports, sp.sports_description
        FROM students s
        LEFT JOIN medical_conditions mc ON s.student_id = mc.student_id
        LEFT JOIN surgeries sur ON s.student_id = sur.student_id
        LEFT JOIN specific_conditions sc ON s.student_id = sc.student_id
        LEFT JOIN injuries_habits ih ON s.student_id = ih.student_id
        LEFT JOIN medications med ON s.student_id = med.student_id
        LEFT JOIN sports sp ON s.student_id = sp.student_id
        ORDER BY s.student_id DESC
    `,
    )

    res.json({
      success: true,
      data: {
        footballRegistrations: footballStudents,
        medicalForms: medicalStudents,
        summary: {
          totalFootballRegistrations: footballStudents.length,
          totalMedicalForms: medicalStudents.length,
          lastUpdated: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching admin data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch data",
      details: error.message,
    })
  }
})

// === NEW ADMIN UPDATE/DELETE ROUTES ===

// Update football registration
app.put("/admin/football/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { first_name, last_name, major, age, team_name } = req.body

    await query(footballDb, "START TRANSACTION")

    // Update student info
    await query(
      footballDb,
      "UPDATE Students SET first_name = ?, last_name = ?, major = ?, age = ? WHERE student_id = ?",
      [first_name, last_name, major, age, id],
    )

    // Update team info
    await query(footballDb, "UPDATE Teams SET team_name = ? WHERE student_id = ?", [team_name, id])

    await query(footballDb, "COMMIT")

    res.json({
      success: true,
      message: "Football registration updated successfully",
    })
  } catch (error) {
    await query(footballDb, "ROLLBACK")
    console.error("Error updating football registration:", error)
    res.status(500).json({
      success: false,
      error: "Failed to update football registration",
      details: error.message,
    })
  }
})

// Delete football registration
app.delete("/admin/football/:id", async (req, res) => {
  try {
    const { id } = req.params

    await query(footballDb, "START TRANSACTION")

    // Delete team record first (foreign key constraint)
    await query(footballDb, "DELETE FROM Teams WHERE student_id = ?", [id])

    // Delete student record
    await query(footballDb, "DELETE FROM Students WHERE student_id = ?", [id])

    await query(footballDb, "COMMIT")

    res.json({
      success: true,
      message: "Football registration deleted successfully",
    })
  } catch (error) {
    await query(footballDb, "ROLLBACK")
    console.error("Error deleting football registration:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete football registration",
      details: error.message,
    })
  }
})

// Update medical form
app.put("/admin/medical/:id", async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    await query(medicalDb, "START TRANSACTION")

    // Update main student record
    await query(
      medicalDb,
      "UPDATE students SET full_name = ?, college = ?, id_number = ?, phone_number = ?, signature_name = ? WHERE student_id = ?",
      [data.full_name, data.college, data.id_number, data.phone_number, data.signature_name, id],
    )

    // Update related tables
    await query(
      medicalDb,
      "UPDATE medical_conditions SET has_conditions = ?, conditions_description = ? WHERE student_id = ?",
      [data.has_conditions || false, data.conditions_description || null, id],
    )

    await query(medicalDb, "UPDATE surgeries SET has_surgeries = ?, surgeries_description = ? WHERE student_id = ?", [
      data.has_surgeries || false,
      data.surgeries_description || null,
      id,
    ])

    await query(
      medicalDb,
      "UPDATE specific_conditions SET has_diabetes = ?, has_high_bp = ?, has_heart_disease = ?, heart_disease_description = ? WHERE student_id = ?",
      [
        data.has_diabetes || false,
        data.has_high_bp || false,
        data.has_heart_disease || false,
        data.heart_disease_description || null,
        id,
      ],
    )

    await query(medicalDb, "UPDATE injuries_habits SET has_spinal_injuries = ?, is_smoker = ? WHERE student_id = ?", [
      data.has_spinal_injuries || false,
      data.is_smoker || false,
      id,
    ])

    await query(medicalDb, "UPDATE medications SET takes_medications = ?, medications_list = ? WHERE student_id = ?", [
      data.takes_medications || false,
      data.medications_list || null,
      id,
    ])

    await query(medicalDb, "UPDATE sports SET practices_sports = ?, sports_description = ? WHERE student_id = ?", [
      data.practices_sports || false,
      data.sports_description || null,
      id,
    ])

    await query(medicalDb, "COMMIT")

    res.json({
      success: true,
      message: "Medical form updated successfully",
    })
  } catch (error) {
    await query(medicalDb, "ROLLBACK")
    console.error("Error updating medical form:", error)
    res.status(500).json({
      success: false,
      error: "Failed to update medical form",
      details: error.message,
    })
  }
})

// Delete medical form
app.delete("/admin/medical/:id", async (req, res) => {
  try {
    const { id } = req.params

    await query(medicalDb, "START TRANSACTION")

    // Delete from all related tables first
    await query(medicalDb, "DELETE FROM medical_conditions WHERE student_id = ?", [id])
    await query(medicalDb, "DELETE FROM surgeries WHERE student_id = ?", [id])
    await query(medicalDb, "DELETE FROM specific_conditions WHERE student_id = ?", [id])
    await query(medicalDb, "DELETE FROM injuries_habits WHERE student_id = ?", [id])
    await query(medicalDb, "DELETE FROM medications WHERE student_id = ?", [id])
    await query(medicalDb, "DELETE FROM sports WHERE student_id = ?", [id])

    // Delete main student record
    await query(medicalDb, "DELETE FROM students WHERE student_id = ?", [id])

    await query(medicalDb, "COMMIT")

    res.json({
      success: true,
      message: "Medical form deleted successfully",
    })
  } catch (error) {
    await query(medicalDb, "ROLLBACK")
    console.error("Error deleting medical form:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete medical form",
      details: error.message,
    })
  }
})

// === EXISTING ROUTES ===

// Football Registration
app.post("/register", async (req, res) => {
  try {
    const { id, first_name, last_name, major, age, team } = req.body

    if (!id || !first_name || !last_name || !major || !age || !team) {
      return res.status(400).json({
        error: "All fields are required",
      })
    }

    await query(footballDb, "START TRANSACTION")

    const studentSql = `
            INSERT INTO Students (student_id, first_name, last_name, major, age) 
            VALUES (?, ?, ?, ?, ?)
        `
    await query(footballDb, studentSql, [id, first_name, last_name, major, age])

    const teamSql = "INSERT INTO Teams (student_id, team_name) VALUES (?, ?)"
    await query(footballDb, teamSql, [id, team])

    await query(footballDb, "COMMIT")

    res.json({
      success: true,
      message: "✅ Football registration successful",
    })
  } catch (error) {
    await query(footballDb, "ROLLBACK")
    console.error("Registration error:", error)

    res.status(500).json({
      error: "Registration failed",
      details: error.message,
    })
  }
})

// Medical Form Submission
app.post("/submit-medical-form", validateMedicalForm, async (req, res) => {
  try {
    const data = req.body
    console.log("Received medical form data:", data)

    await query(medicalDb, "START TRANSACTION")

    const studentSql = `
            INSERT INTO students 
            (full_name, college, id_number, phone_number, signature_name, agreement_accepted)
            VALUES (?, ?, ?, ?, ?, ?)
        `
    const studentValues = [
      data.full_name,
      data.college,
      data.id_number,
      data.phone_number,
      data.signature_name,
      data.agreement_accepted,
    ]

    const studentResult = await query(medicalDb, studentSql, studentValues)
    const studentId = studentResult.insertId

    const inserts = [
      query(
        medicalDb,
        "INSERT INTO medical_conditions (student_id, has_conditions, conditions_description) VALUES (?, ?, ?)",
        [studentId, data.has_conditions || false, data.conditions_description || null],
      ),
      query(medicalDb, "INSERT INTO surgeries (student_id, has_surgeries, surgeries_description) VALUES (?, ?, ?)", [
        studentId,
        data.has_surgeries || false,
        data.surgeries_description || null,
      ]),
      query(
        medicalDb,
        "INSERT INTO specific_conditions (student_id, has_diabetes, has_high_bp, has_heart_disease, heart_disease_description) VALUES (?, ?, ?, ?, ?)",
        [
          studentId,
          data.has_diabetes || false,
          data.has_high_bp || false,
          data.has_heart_disease || false,
          data.heart_disease_description || null,
        ],
      ),
      query(medicalDb, "INSERT INTO injuries_habits (student_id, has_spinal_injuries, is_smoker) VALUES (?, ?, ?)", [
        studentId,
        data.has_spinal_injuries || false,
        data.is_smoker || false,
      ]),
      query(medicalDb, "INSERT INTO medications (student_id, takes_medications, medications_list) VALUES (?, ?, ?)", [
        studentId,
        data.takes_medications || false,
        data.medications_list || null,
      ]),
      query(medicalDb, "INSERT INTO sports (student_id, practices_sports, sports_description) VALUES (?, ?, ?)", [
        studentId,
        data.practices_sports || false,
        data.sports_description || null,
      ]),
    ]

    await Promise.all(inserts)
    await query(medicalDb, "COMMIT")

    res.json({
      success: true,
      message: "✅ Medical form submitted successfully",
      studentId,
    })
  } catch (error) {
    await query(medicalDb, "ROLLBACK")
    console.error("Medical form submission error:", error)

    res.status(500).json({
      error: "Medical form submission failed",
      details: error.message,
    })
  }
})

// Serve the main index.html at root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...")
  footballDb.end()
  medicalDb.end()
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...")
  footballDb.end()
  medicalDb.end()
  process.exit(0)
})
