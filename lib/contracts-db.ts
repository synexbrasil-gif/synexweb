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
  paymentId?: string | null
}

export type MercadoPagoIntegration = {
  publicKey: string
  accessToken: string
  clientId: string
  clientSecret: string
  updatedAt: string | null
}

type ContractRow = RowDataPacket & {
  id: string
  full_name: string
  username: string
  password: string
  activation_date: string
  plan: string
  payment_id: string | null
  created_at: Date | string
}

type IntegrationRow = RowDataPacket & {
  provider: string
  public_key: string
  access_token: string
  client_id: string
  client_secret: string
  updated_at: Date | string | null
}

type ContractInput = Omit<Contract, "id" | "createdAt">
type MercadoPagoIntegrationInput = Omit<MercadoPagoIntegration, "updatedAt">

let pool: mysql.Pool | null = null
let schemaReady: Promise<void> | null = null

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
}

function getDatabaseUrl() {
  return firstEnv("MYSQL_URL", "MYSQL_PUBLIC_URL", "DATABASE_URL")
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

  const host = firstEnv("MYSQLHOST", "MYSQL_HOST")
  const user = firstEnv("MYSQLUSER", "MYSQL_USER")
  const password = firstEnv("MYSQLPASSWORD", "MYSQL_PASSWORD", "MYSQL_ROOT_PASSWORD")
  const database = firstEnv("MYSQLDATABASE", "MYSQL_DATABASE")
  const port = Number(firstEnv("MYSQLPORT", "MYSQL_PORT") ?? 3306)

  if (!host || !user || !password || !database) {
    throw new Error(
      "Configure MYSQL_URL no servico do site ou MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE para usar o MySQL.",
    )
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

function isAlreadyExistsSchemaError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ER_DUP_FIELDNAME" || error.code === "ER_DUP_KEYNAME")
  )
}

async function ensureContractPaymentSchema() {
  try {
    await getPool().execute("ALTER TABLE contracts ADD COLUMN payment_id VARCHAR(100) NULL")
  } catch (error) {
    if (!isAlreadyExistsSchemaError(error)) throw error
  }

  try {
    await getPool().execute("CREATE UNIQUE INDEX idx_contracts_payment_id ON contracts (payment_id)")
  } catch (error) {
    if (!isAlreadyExistsSchemaError(error)) throw error
  }
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
          payment_id VARCHAR(100) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_contracts_username (username),
          UNIQUE INDEX idx_contracts_payment_id (payment_id)
        )
      `)
      .then(() => ensureContractPaymentSchema())
      .then(() =>
        getPool().execute(`
          CREATE TABLE IF NOT EXISTS payment_integrations (
            provider VARCHAR(50) NOT NULL PRIMARY KEY,
            public_key TEXT NOT NULL,
            access_token TEXT NOT NULL,
            client_id VARCHAR(255) NOT NULL,
            client_secret TEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `),
      )
      .then(() => undefined)
  }

  return schemaReady
}

function mapMercadoPagoIntegration(row: IntegrationRow): MercadoPagoIntegration {
  const updatedAt = row.updated_at
    ? row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString()
    : null

  return {
    publicKey: row.public_key,
    accessToken: row.access_token,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    updatedAt,
  }
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
    paymentId: row.payment_id,
    createdAt,
  }
}

export async function listContracts() {
  await ensureSchema()

  const [rows] = await getPool().execute<ContractRow[]>(`
    SELECT id, full_name, username, password, activation_date, plan, payment_id, created_at
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
      INSERT INTO contracts (id, full_name, username, password, activation_date, plan, payment_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      contract.id,
      contract.fullName,
      contract.username,
      contract.password,
      contract.activationDate,
      contract.plan,
      contract.paymentId ?? null,
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
      SELECT id, full_name, username, password, activation_date, plan, payment_id, created_at
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
      SELECT id, full_name, username, password, activation_date, plan, payment_id, created_at
      FROM contracts
      WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [username],
  )

  return rowsByUsername[0] ? mapContract(rowsByUsername[0]) : null
}

export async function findContractByPaymentId(paymentId: string) {
  await ensureSchema()

  const [rows] = await getPool().execute<ContractRow[]>(
    `
      SELECT id, full_name, username, password, activation_date, plan, payment_id, created_at
      FROM contracts
      WHERE payment_id = ?
      LIMIT 1
    `,
    [paymentId],
  )

  return rows[0] ? mapContract(rows[0]) : null
}

export async function createContractFromApprovedPayment(input: {
  paymentId: string
  fullName: string
  plan: string
  activationDate: string
}) {
  const existingContract = await findContractByPaymentId(input.paymentId)
  if (existingContract) return existingContract

  return createContract({
    fullName: input.fullName,
    username: "0",
    password: "0",
    activationDate: input.activationDate,
    plan: input.plan,
    paymentId: input.paymentId,
  })
}

export async function getMercadoPagoIntegration() {
  await ensureSchema()

  const [rows] = await getPool().execute<IntegrationRow[]>(
    `
      SELECT provider, public_key, access_token, client_id, client_secret, updated_at
      FROM payment_integrations
      WHERE provider = 'mercado_pago'
      LIMIT 1
    `,
  )

  return rows[0] ? mapMercadoPagoIntegration(rows[0]) : null
}

export async function saveMercadoPagoIntegration(input: MercadoPagoIntegrationInput) {
  await ensureSchema()

  await getPool().execute(
    `
      INSERT INTO payment_integrations (provider, public_key, access_token, client_id, client_secret)
      VALUES ('mercado_pago', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        public_key = VALUES(public_key),
        access_token = VALUES(access_token),
        client_id = VALUES(client_id),
        client_secret = VALUES(client_secret),
        updated_at = CURRENT_TIMESTAMP
    `,
    [input.publicKey, input.accessToken, input.clientId, input.clientSecret],
  )

  return getMercadoPagoIntegration()
}
