const minimist = require('minimist')
const fs = require('fs')
const fetch = require('node-fetch')
const FormData = require('form-data')
const ProgressBar = require('progress')

// Get the arguments from the CLI
const argv = minimist(process.argv.slice(2))

// Make sure that the required options exist
if (!argv.username || !argv.password || !argv.file) {
  console.log(
    'Usage: instapaper-importer --username=MYUSER --password=MYPASSWORD --file=./urls.txt'
  )
  process.exit(1)
}

// Make sure the file exists
if (!fs.existsSync(argv.file)) {
  console.log(`File ${argv.file} does not exist`)
  process.exit(1)
}

// Parse all the URLs
const urls = fs.readFileSync(argv.file, 'utf-8').split('\n')
console.log(`Parsed ${urls.length} URLs from file`)

// Import each URL one by one
importAllUrls(urls)

async function importAllUrls (urls) {
  var bar = new ProgressBar(
    'importing urls [:bar] :current/:total (:percent) :etas',
    {
      complete: '=',
      incomplete: ' ',
      width: 50,
      total: urls.length
    }
  )

  for (let i = 0; i !== urls.length; i++) {
    await importUrl({
      url: urls[i],
      username: argv.username,
      password: argv.password
    })

    bar.tick(1)
  }

  console.log('Import finished.')
}

async function importUrl (args) {
  const form = new FormData()
  form.append('username', args.username)
  form.append('password', args.password)
  form.append('url', args.url)

  const options = {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  }

  const response = await fetch('https://www.instapaper.com/api/add', options)
  const content = await response.text()

  if (response.status >= 400) {
    console.log(`Import failed: ${content}`)
    process.exit(1)
  }

  return true
}
