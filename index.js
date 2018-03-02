let express = require('express')
let path = require('path')
let multer = require('multer')
let bodyParser = require('body-parser')
let fs = require('fs')
let execa = require('execa')

let app = express()
let RESULTS_DIR = path.join(__dirname, 'results')
let DEEP_ANALOGY_DIR = path.join(__dirname, '..', 'deep-analogy')
let OUT_DIR = path.join(
  __dirname,
  '..',
  'deep-analogy',
  'deep_image_analogy',
  'demo',
  'output',
)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer({ dest: 'uploads' })) // dest is not necessary if you are happy with the default: /tmp
app.use(express.static(path.join(__dirname, 'bower_components')))

// show output files
app.use('/results', express.static(RESULTS_DIR))

// routes
app.get('/', function(req, res) {
  res.send(
    '<html><head><title>Dropzone example</title><link href="/dropzone/downloads/css/dropzone.css" rel="stylesheet"></head><body><h1>Using Dropzone</h1><form method="post" action="/" class="dropzone" id="dropzone-example"><div class="fallback"><input name="file" type="file" multiple /></div></form><p><a href="/old">Old form version</a></p><script src="/dropzone/downloads/dropzone.js"></script></body></html>',
  )
})

let files = []

app.post('/', function(req, res) {
  var file = req.files.file
  files.push(file)

  if (files.length === 2) {
    let current = files
    files = [] // reset for next run
    let allResults = fs.readdirSync(RESULTS_DIR)
    if (!allResults) return
    let out = path.join(RESULTS_DIR, `out_${allResults.length + 1}`)
    let content = path.join(__dirname, current[0].path)
    let style = path.join(__dirname, current[1].path)
    execa('mkdir', `${out}`)
    // ./demo deep_image_analogy/models/ ../test/content.jpg ../test/style.jpg deep_image_analogy/demo/output/ 0 0.5 2 0
    console.log(
      'in',
      DEEP_ANALOGY_DIR,
      'running',
      `./demo`,
      `deep_image_analogy/models/ ${content} ${style} ${out} 0 0.5 3 0`,
    )
    execa(
      `./demo`,
      `deep_image_analogy/models/ ${content} ${style} ${out} 0 0.5 3 0`.split(
        ' ',
      ),
      {
        cwd: DEEP_ANALOGY_DIR,
      },
    ).then(done => {
      console.log('done!')
      // copy
    })
  }

  res.sendStatus(200)
})

var server = app.listen(80, '0.0.0.0', function() {
  var host = server.address().address,
    port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})
