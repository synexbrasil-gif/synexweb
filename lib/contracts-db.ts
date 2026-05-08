import { randomUUID } from "crypto"
import { mkdirSync } from "fs"
import path from "path"
import Database from "better-sqlite3"

export type Contract = {
  id: string
  fullName: string
  username: string
  password: string
  loginUsername?: string | null
  loginPassword?: string | null
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

export type Plan = {
  id: string
  name: string
  price: number
  description: string
  updatedAt: string | null
}

type ContractRow = {
  id: string
  full_name: string
  username: string
  password: string
  login_username: string | null
  login_password: string | null
  activation_date: string
  plan: string
  payment_id: string | null
  created_at: string
}

type IntegrationRow = {
  provider: string
  public_key: string
  access_token: string
  client_id: string
  client_secret: string
  updated_at: string | null
}

type PlanRow = {
  id: string
  name: string
  price: number
  description: string
  updated_at: string | null
}

type ContractInput = Omit<Contract, "id" | "createdAt">
type MercadoPagoIntegrationInput = Omit<MercadoPagoIntegration, "updatedAt">
type PlanInput = Pick<Plan, "id" | "price">

let db: Database.Database | null = null
let schemaReady: Promise<void> | null = null

function getDatabasePath() {
  return path.join(process.cwd(), "database", "synex.sqlite")
}

function getDb() {
  if (db) return db

  const databasePath = getDatabasePath()
  mkdirSync(path.dirname(databasePath), { recursive: true })

  db = new Database(databasePath)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  return db
}

function formatPersonName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)(\p{L})/gu, (_match, separator: string, letter: string) => {
      return `${separator}${letter.toLocaleUpperCase("pt-BR")}`
    })
}

function toIsoDate(value: string | null) {
  return value ? new Date(value).toISOString() : null
}

function mapPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    updatedAt: toIsoDate(row.updated_at),
  }
}

function mapMercadoPagoIntegration(row: IntegrationRow): MercadoPagoIntegration {
  return {
    publicKey: row.public_key,
    accessToken: row.access_token,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    updatedAt: toIsoDate(row.updated_at),
  }
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    password: row.password,
    loginUsername: row.login_username,
    loginPassword: row.login_password,
    activationDate: row.activation_date,
    plan: row.plan,
    paymentId: row.payment_id,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function ensureContractPaymentSchema() {
  const columns = getDb().prepare("PRAGMA table_info(contracts)").all() as Array<{ name: string }>

  if (!columns.some((column) => column.name === "payment_id")) {
    getDb().prepare("ALTER TABLE contracts ADD COLUMN payment_id TEXT NULL").run()
  }

  if (!columns.some((column) => column.name === "login_username")) {
    getDb().prepare("ALTER TABLE contracts ADD COLUMN login_username TEXT NULL").run()
  }

  if (!columns.some((column) => column.name === "login_password")) {
    getDb().prepare("ALTER TABLE contracts ADD COLUMN login_password TEXT NULL").run()
  }

  getDb().prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_payment_id ON contracts (payment_id)").run()
  getDb()
    .prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_login_username ON contracts (login_username) WHERE login_username IS NOT NULL",
    )
    .run()
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.resolve().then(() => {
      const database = getDb()

      database
        .prepare(
          `
            CREATE TABLE IF NOT EXISTS contracts (
              id TEXT NOT NULL PRIMARY KEY,
              full_name TEXT NOT NULL,
              username TEXT NOT NULL,
              password TEXT NOT NULL,
              login_username TEXT NULL,
              login_password TEXT NULL,
              activation_date TEXT NOT NULL,
              plan TEXT NOT NULL,
              payment_id TEXT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `,
        )
        .run()

      database.prepare("CREATE INDEX IF NOT EXISTS idx_contracts_username ON contracts (username)").run()
      ensureContractPaymentSchema()

      database
        .prepare(
          `
            CREATE TABLE IF NOT EXISTS payment_integrations (
              provider TEXT NOT NULL PRIMARY KEY,
              public_key TEXT NOT NULL,
              access_token TEXT NOT NULL,
              client_id TEXT NOT NULL,
              client_secret TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `,
        )
        .run()

      database
        .prepare(
          `
            CREATE TABLE IF NOT EXISTS plans (
              id TEXT NOT NULL PRIMARY KEY,
              name TEXT NOT NULL,
              price REAL NOT NULL,
              description TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `,
        )
        .run()

      database
        .prepare(
          `
            INSERT OR IGNORE INTO plans (id, name, price, description)
            VALUES
              ('mensal', 'Mensal', 29.90, 'Ideal para experimentar'),
              ('trimestral', 'Trimestral', 49.90, 'Melhor custo-beneficio'),
              ('anual', 'Anual', 99.90, 'Maior economia')
          `,
        )
        .run()
    })
  }

  return schemaReady
}

export async function listContracts() {
  await ensureSchema()

  const rows = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        ORDER BY created_at DESC
      `,
    )
    .all() as ContractRow[]

  return rows.map(mapContract)
}

export async function createContract(input: ContractInput) {
  await ensureSchema()

  const contract: Contract = {
    id: randomUUID(),
    ...input,
    fullName: formatPersonName(input.fullName),
    createdAt: new Date().toISOString(),
  }

  getDb()
    .prepare(
      `
        INSERT INTO contracts (id, full_name, username, password, activation_date, plan, payment_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      contract.id,
      contract.fullName,
      contract.username,
      contract.password,
      contract.activationDate,
      contract.plan,
      contract.paymentId ?? null,
      contract.createdAt,
    )

  return contract
}

export async function deleteContract(contractId: string) {
  await ensureSchema()

  getDb().prepare("DELETE FROM contracts WHERE id = ?").run(contractId)
  return listContracts()
}

export async function updateContract(contractId: string, input: ContractInput) {
  await ensureSchema()
  const fullName = formatPersonName(input.fullName)

  getDb()
    .prepare(
      `
        UPDATE contracts
        SET full_name = ?, username = ?, password = ?, activation_date = ?, plan = ?
        WHERE id = ?
      `,
    )
    .run(fullName, input.username, input.password, input.activationDate, input.plan, contractId)

  const row = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(contractId) as ContractRow | undefined

  return row ? mapContract(row) : null
}

export async function updateContractCredentials(contractId: string, input: Pick<Contract, "loginUsername" | "loginPassword">) {
  await ensureSchema()

  const existingLogin = getDb()
    .prepare(
      `
        SELECT id
        FROM contracts
        WHERE LOWER(TRIM(login_username)) = LOWER(TRIM(?)) AND id <> ?
        LIMIT 1
      `,
    )
    .get(input.loginUsername, contractId) as { id: string } | undefined

  if (existingLogin) {
    throw new Error("Este usuario de login ja esta sendo usado em outro contrato.")
  }

  getDb()
    .prepare(
      `
        UPDATE contracts
        SET login_username = ?, login_password = ?
        WHERE id = ?
      `,
    )
    .run(input.loginUsername, input.loginPassword, contractId)

  const row = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(contractId) as ContractRow | undefined

  return row ? mapContract(row) : null
}

export async function updateContractLoginByPaymentId(paymentId: string, input: Pick<Contract, "loginUsername" | "loginPassword">) {
  const contract = await findContractByPaymentId(paymentId)
  if (!contract) return null

  return updateContractCredentials(contract.id, input)
}

export async function findSubscriberByCredentials(username: string, password: string) {
  await ensureSchema()

  const rowByCredentials = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) AND TRIM(password) = TRIM(?)
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(username, password) as ContractRow | undefined

  if (rowByCredentials) {
    return mapContract(rowByCredentials)
  }

  const rowByUsername = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(username) as ContractRow | undefined

  return rowByUsername ? mapContract(rowByUsername) : null
}

export async function findSubscriberByLoginCredentials(username: string, password: string) {
  await ensureSchema()

  const row = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE LOWER(TRIM(login_username)) = LOWER(TRIM(?)) AND TRIM(login_password) = TRIM(?)
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(username, password) as ContractRow | undefined

  return row ? mapContract(row) : null
}

export async function findContractByPaymentId(paymentId: string) {
  await ensureSchema()

  const row = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE payment_id = ?
        LIMIT 1
      `,
    )
    .get(paymentId) as ContractRow | undefined

  return row ? mapContract(row) : null
}

export async function findContractById(contractId: string) {
  await ensureSchema()

  const row = getDb()
    .prepare(
      `
        SELECT id, full_name, username, password, login_username, login_password, activation_date, plan, payment_id, created_at
        FROM contracts
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(contractId) as ContractRow | undefined

  return row ? mapContract(row) : null
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

  const row = getDb()
    .prepare(
      `
        SELECT provider, public_key, access_token, client_id, client_secret, updated_at
        FROM payment_integrations
        WHERE provider = 'mercado_pago'
        LIMIT 1
      `,
    )
    .get() as IntegrationRow | undefined

  return row ? mapMercadoPagoIntegration(row) : null
}

export async function saveMercadoPagoIntegration(input: MercadoPagoIntegrationInput) {
  await ensureSchema()

  getDb()
    .prepare(
      `
        INSERT INTO payment_integrations (provider, public_key, access_token, client_id, client_secret)
        VALUES ('mercado_pago', ?, ?, ?, ?)
        ON CONFLICT(provider) DO UPDATE SET
          public_key = excluded.public_key,
          access_token = excluded.access_token,
          client_id = excluded.client_id,
          client_secret = excluded.client_secret,
          updated_at = CURRENT_TIMESTAMP
      `,
    )
    .run(input.publicKey, input.accessToken, input.clientId, input.clientSecret)

  return getMercadoPagoIntegration()
}

export async function listPlans() {
  await ensureSchema()

  const rows = getDb()
    .prepare(
      `
        SELECT id, name, price, description, updated_at
        FROM plans
        ORDER BY CASE id WHEN 'mensal' THEN 1 WHEN 'trimestral' THEN 2 WHEN 'anual' THEN 3 ELSE 4 END, name
      `,
    )
    .all() as PlanRow[]

  return rows.map(mapPlan)
}

export async function getPlanById(planId: string) {
  await ensureSchema()

  const row = getDb()
    .prepare(
      `
        SELECT id, name, price, description, updated_at
        FROM plans
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(planId) as PlanRow | undefined

  return row ? mapPlan(row) : null
}

export async function updatePlans(inputs: PlanInput[]) {
  await ensureSchema()

  const validPlanIds = new Set(["mensal", "trimestral", "anual"])
  const plans = inputs.filter((plan) => validPlanIds.has(plan.id) && Number.isFinite(plan.price) && plan.price >= 0.01)

  if (plans.length === 0) {
    return listPlans()
  }

  const updatePlan = getDb().prepare(
    `
      UPDATE plans
      SET price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
  const updateManyPlans = getDb().transaction((plansToUpdate: PlanInput[]) => {
    for (const plan of plansToUpdate) {
      updatePlan.run(plan.price, plan.id)
    }
  })

  updateManyPlans(plans)

  return listPlans()
}
