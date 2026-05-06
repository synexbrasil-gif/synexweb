import { randomUUID } from "crypto"
import mysql, { type RowDataPacket } from "mysql2/promise"

export type Contract = {
  id: string
  fullName: string
  username: string
  password: string
  activationDate: string
  plan: string
  createdAt: string
}

type ContractRow = RowDataPacket & {
  id: string
  full_name: string
  username: string
  password: string
  activation_date: string
  plan: string
  created_at: Date | string
}

type ContractInput = Omit<Contract, "id" | "createdAt">

let pool: mysql.Pool | null = null
let schemaReady: Promise<void> | null = null

function getDatabaseUrl() {
  return process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL
}

function getPool() {
  if (pool) return pool

  const uri = getDatabaseUrl()
  if (uri) {
    pool = mysql.createPool({
      uri,
      connectionLimit: 10,
      waitForConnections: true,
    })

    return pool
  }

  const host = process.env.MYSQLHOST
  const user = process.env.MYSQLUSER
  const password = process.env.MYSQLPASSWORD
  const database = process.env.MYSQLDATABASE
  const port = Number(process.env.MYSQLPORT ?? 3306)

  if (!host || !user || !database) {
    throw new Error("Configure MYSQL_URL ou MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE para usar o MySQL.")
  }

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    connectionLimit: 10,
    waitForConnections: true,
  })

  return pool
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .execute(`
        CREATE TABLE IF NOT EXISTS contracts (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          activation_date VARCHAR(50) NOT NULL,
          plan VARCHAR(100) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_contracts_username (username)
        )
      `)
      .then(() => undefined)
  }

  return schemaReady
}

function mapContract(row: ContractRow): Contract {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()

  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    password: row.password,
    activationDate: row.activation_date,
    plan: row.plan,
    createdAt,
  }
}

export async function listContracts() {
  await ensureSchema()

  const [rows] = await getPool().execute<ContractRow[]>(`
    SELECT id, full_name, username, password, activation_date, plan, created_at
    FROM contracts
    ORDER BY created_at DESC
  `)

  return rows.map(mapContract)
}

export async function createContract(input: ContractInput) {
  await ensureSchema()

  const contract: Contract = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  }

  await getPool().execute(
    `
      INSERT INTO contracts (id, full_name, username, password, activation_date, plan, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      contract.id,
      contract.fullName,
      contract.username,
      contract.password,
      contract.activationDate,
      contract.plan,
      contract.createdAt.slice(0, 19).replace("T", " "),
    ],
  )

  return contract
}

export async function deleteContract(contractId: string) {
  await ensureSchema()

  await getPool().execute("DELETE FROM contracts WHERE id = ?", [contractId])
  return listContracts()
}

export async function findSubscriberByCredentials(username: string, password: string) {
  await ensureSchema()

  const [rowsByCredentials] = await getPool().execute<ContractRow[]>(
    `
      SELECT id, full_name, username, password, activation_date, plan, created_at
      FROM contracts
      WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) AND TRIM(password) = TRIM(?)
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [username, password],
  )

  if (rowsByCredentials[0]) {
    return mapContract(rowsByCredentials[0])
  }

  const [rowsByUsername] = await getPool().execute<ContractRow[]>(
    `
      SELECT id, full_name, username, password, activation_date, plan, created_at
      FROM contracts
      WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [username],
  )

  return rowsByUsername[0] ? mapContract(rowsByUsername[0]) : null
}
