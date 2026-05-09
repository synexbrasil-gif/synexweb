const Database = require("better-sqlite3")
const fs = require("fs")
const path = require("path")

const databasePath = path.join(process.cwd(), "database", "synex.sqlite")

if (!fs.existsSync(databasePath)) {
  console.log("Database not found, skipping checkpoint:", databasePath)
  process.exit(0)
}

const db = new Database(databasePath)

try {
  const [checkpoint] = db.pragma("wal_checkpoint(TRUNCATE)")
  db.pragma("optimize")

  if (checkpoint && checkpoint.busy > 0) {
    console.error("Database checkpoint is busy. Stop the app locally and run npm run database:deploy again.")
    process.exitCode = 1
  } else {
    console.log("Database ready for deploy:", databasePath)
  }
} finally {
  db.close()
}
