const { spawn } = require("child_process")

const port = process.env.PORT || "8080"
const nextBin = require.resolve("next/dist/bin/next")

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
