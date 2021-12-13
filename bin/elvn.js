#!/usr/bin/env node

import cac from "cac";
import { createServer } from "../src/server.js";

const cli = cac()

cli.command('dev', 'Start a development server')
  .alias('serve')
  .option('--port <portNumber>', 'HTTP port to listen on', { default: 3003 })
  .action((options) => {
    const { portNumber } = options
    createServer(portNumber)
  })

cli.help()
cli.parse()