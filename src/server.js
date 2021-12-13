import path from 'path'
import sirv from 'sirv';
import { createServer as createViteServer } from 'vite';
import connect from 'connect';
import http from 'http';
import Eleventy from '@11ty/eleventy';
import chalk from 'chalk';

function viteIgnoreGlobs(elev) {
  const elevGlobs = elev.eleventyFiles.validTemplateGlobs

  return [
    path.join(elev.outputDir, "**/*"),
    ...elevGlobs,
  ].map(entry => path.join("**", entry))
}

async function elvnDevServer(elev) {
  const app = connect();

  const vite = await createViteServer({
    clearScreen: false,
    server: {
      middlewareMode: 'ssr',
      watch: {
        ignored: viteIgnoreGlobs(elev)
      }
    }
  })

  app.use(vite.middlewares)

  app.use(sirv(elev.outputDir, {
    dev: true
  }))

  return { 
    app, 
    vite,
    refreshPage() {
      console.log(chalk.green(`Refreshing page`))

      vite.ws.send({
        type: 'full-reload',
        path: '*'
      })
    }
  }
}

// TODO: make these configurable
export async function createServer(portNumber = 3003, inputDir = null, outputDir = null) {
  
  const elev = new Eleventy(inputDir, outputDir, {
    source: "cli",
    quietMode: true,
    debug: true
  })
  elev.setIncrementalBuild(true)

  await elev.init()
  const { app, refreshPage } = await elvnDevServer(elev)

  elev.watch()
    .catch(e => console.log(`There was an error: ${e}`))
    .then(_ => {
      http.createServer(app).listen(portNumber)
      console.log(`\n🚀 ` + chalk.blue(`Dev server is now running on ${chalk.bold(`http://localhost:${portNumber}`)}`))

      // OK, *now* attach an afterBuild event
      elev.config.events.on('afterBuild', _ => {
        console.log(_)
        refreshPage()
      })
    })
}