let express = require('express')
let path = require('path')
let multer = require('multer')
let bodyParser = require('body-parser')
let fs = require('fs')
let execa = require('execa')
let serveIndex = require('serve-index')

const sleep = ms => new Promise(res => setTimeout(res, ms))
let app = express()
let RESULTS_DIR = path.resolve(__dirname, 'results')
let DEEP_ANALOGY_DIR = path.resolve(__dirname, '..', 'deep-analogy')
let OUT_DIR = path.resolve(
  DEEP_ANALOGY_DIR,
  'deep_image_analogy',
  'demo',
  'output',
)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer({ dest: 'uploads' })) // dest is not necessary if you are happy with the default: /tmp
app.use(express.static(path.join(__dirname, 'bower_components')))

// show output files
app.use(
  '/results',
  express.static(RESULTS_DIR),
  serveIndex(RESULTS_DIR, { icons: true }),
)

// routes
app.get('/', express.static('templates'))

let files = []
let jobs = []
let settings = '1 3 0'
let SETTING_VALS = {
  0: '1 3',
  1: '0.5 3',
  2: '0 2',
  3: '0.5 2',
  4: '1 1',
}

app.get('/jobs', (req, res) => {
  res.send(`<ul>${jobs.map(job => `<li>settings: ${job.settings}</li>`)}</ul>`)
})

async function processQueue() {
  while (true) {
    if (jobs.length) {
      let job = jobs.shift()
      console.log('running job', job)
      let { files, settings } = job
      let allResults = fs.readdirSync(RESULTS_DIR)
      if (!allResults) return
      console.log('results', allResults.length)
      let out = path.join(RESULTS_DIR, `out_${allResults.length + 2}`)
      let content = path.join(__dirname, files[0].path)
      let style = path.join(__dirname, files[1].path)
      try {
        const cmd = `./demo deep_image_analogy/models/ ${content} ${style} ${OUT_DIR}/ 0 ${settings}`
        console.log('running', cmd)
        await execa.shell(cmd, {
          cwd: DEEP_ANALOGY_DIR,
          env: {
            LD_LIBRARY_PATH:
              '/home/nw/deep-analogy/build/lib:/usr/local/cuda/lib64',
          },
        })
        const cmd2 = `mv ${OUT_DIR} ${out}`
        console.log(cmd2)
        // write out settings for this run
        fs.writeFileSync(path.join(out, 'settings.txt'), cmd)
        await execa.shell(cmd2)
        await execa.shell(`mkdir ${OUT_DIR}`)
      } catch (err) {
        console.log('error running deep analogy', err)
      }
      console.log('done!')
    } else {
      await sleep(200)
    }
  }
}

app.post('/', function(req, res) {
  if (req.body && req.body.type) {
    console.log('settings', req.body)
    let type = req.body.type
    let smoothing = req.body.smoothing
    if (SETTING_VALS[type]) {
      settings = `${SETTING_VALS[type]} ${smoothing === 'on' ? 1 : 0}`
    }
    res.redirect('/')
    return
  }
  var file = req.files.file
  if (file) {
    files.push(file)
    if (files.length === 2) {
      jobs.push({
        files,
        settings,
      })
      files = []
    }
  }
  res.sendStatus(200)
})

var server = app.listen(
  process.env.NODE_ENV === 'development' ? 3000 : 80,
  '0.0.0.0',
  function() {
    var host = server.address().address,
      port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
  },
)

processQueue()
