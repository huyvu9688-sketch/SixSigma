// Runs the compiled CommonJS output of scripts/verify-stats.ts. The project is
// "type": "module", so mark the build dir as CommonJS before requiring it.
import { writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, "..", "node_modules", ".cache", "verify-out")
writeFileSync(path.join(outDir, "package.json"), '{ "type": "commonjs" }\n')
const require = createRequire(import.meta.url)
require(path.join(outDir, "scripts", "verify-stats.js"))
