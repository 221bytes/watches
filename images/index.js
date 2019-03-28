var Crawler = require("crawler");

const https = require('https');
const fs = require('fs');
const { get } = require('lodash')
var program = require('commander');
 
program
  .version('0.1.0')
  .option('-p, --pages <n>', 'The number of pages to download', '130')
  .option('-b, --brand [value]', 'The watch brand', 'rolex')
  .option('-u, --uri [value]', 'The watch uri where to pictures are', 'https://www.watchadvisor.com/en/search?f%5B0%5D=og_group_brand_ref%3A2064')
  .parse(process.argv);
 
console.log('%s %s %s', program.brand, program.pages,  program.uri);

var dir = `./raw_images/${program.brand}`;

if (!fs.existsSync('./raw_images')){
  fs.mkdirSync('./raw_images');
}

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const regex = '\/images_imported\/(.+?).jpg'

const getImage = (name, uri) => {
    const file = fs.createWriteStream(name);
    const request = https.get(uri, function (response) {
        response.pipe(file);
    });
}

var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            $("img").each((_, elem) => {
                src = $(elem).attr("src")
                filename = get(src.match(regex), '[1]', null)
                if (filename !== null) {
                    getImage(`${dir}/${filename}.jpg`, $(elem).attr("src"))
                }
            });
        }
        done();
    }
});

for (let index = 0; index < program.pages; index++) {
    
    c.queue({
        headers: {
            Cookie: "SSESSconsent=1"
        },
        uri: `${program.uri}&page=${index}`
    });
}

