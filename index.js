const { spawnSync, spawn } = require("child_process")
const { existsSync } = require("fs")
const { join } = require("path")

const port = process.env.PORT || "8080"
const nextBin = require.resolve("next/dist/bin/next")

if (!existsSync(join(__dirname, ".next", "BUILD_ID"))) {
  const build = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: process.env,
  })

  if (build.status !== 0) {
    process.exit(build.status ?? 1)
  }
}

const server = spawn(process.execPath, [nextBin, "start", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
  },
})

server.on("exit", (code) => {
  process.exit(code ?? 0)
})
