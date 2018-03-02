let express = require('express')
let path = require('path')
let multer = require('multer')
let bodyParser = require('body-parser')
let fs = require('fs')

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

app.post('/', function(req, res) {
  var files = req.files.file
  if (!Array.isArray(files)) {
    return res.sendStatus(500)
  }
  if (files.length !== 2) {
    return res.sendStatus(500)
  }

  let lastRun = fs.readdirSync(RESULTS_DIR)

  if (lastRun) {
    console.log('lastRun', lastRun)
  }

  let out = path.join(RESULTS_DIR, `results_${lastRun.length + 1}`)
  let content = path.join(__dirname, files[0].path)
  let style = path.join(__dirname, files[1].path)

  execa('mkdir', `${out}`)
  // ./demo deep_image_analogy/models/ ../test/content.jpg ../test/style.jpg deep_image_analogy/demo/output/ 0 0.5 2 0
  execa(
    `demo`,
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

  res.sendStatus(200)
})

var server = app.listen(3000, function() {
  var host = server.address().address,
    port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})
