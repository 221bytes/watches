const Crawler = require("crawler");
const https = require('https');
const fs = require('fs');
const readline = require('readline');
const { get } = require('lodash')

// var program = require('commander');

// program
//   .version('0.1.0')
//   .option('-p, --pages <n>', 'The number of pages to download', '130')
//   .option('-b, --brand [value]', 'The watch brand', 'rolex')
//   .option('-u, --uri [value]', 'The watch uri where to pictures are', 'https://www.watchadvisor.com/en/search?f%5B0%5D=og_group_brand_ref%3A2064')
//   .parse(process.argv);

// console.log('%s %s %s', program.brand, program.pages,  program.uri);

// var dir = `./raw_images/${program.brand}`;

if (!fs.existsSync('./raw_images')) {
    fs.mkdirSync('./raw_images');
}

// if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir);
// }

const regexImagesImported = '\/images_imported\/(.+?).\?.itok'
const regexImages = '\/images\/(.+?).\?.itok'

const getImage = (name, uri) => {
    const file = fs.createWriteStream(name);
    const request = https.get(uri, function (response) {
        response.pipe(file);
    });
}

const c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            console.log('working on :', res.options.brand)

            $("img").each((_, elem) => {
                src = $(elem).attr("src")
                filename = get(src.match(regexImagesImported), '[1]', null) || get(src.match(regexImages), '[1]', null)
                if (filename !== null) {
                    const dir = `./raw_images/${res.options.brand}`;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    getImage(`${dir}/${filename}.jpg`, $(elem).attr("src"))
                }
            });
            console.log('done :', res.options.brand)

        }
        done();
    }
});

// for (let index = 0; index < program.pages; index++) {

//     c.queue({
//         headers: {
//             Cookie: "SSESSconsent=1"
//         },
//         uri: `${program.uri}&page=${index}`
//     });
// }


const brandCrawler = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            const watchesPage = `https://www.watchadvisor.com${$("div.field.field-name-brand-all-watches-link a").attr('href')}`
            for (let index = 0; index < 130; index++) {

                c.queue({
                    headers: {
                        Cookie: "SSESSconsent=1"
                    },
                    uri: `${watchesPage}&page=${index}`,
                    brand: res.options.brand,
                });
            }
        }
        done();
    }
});

const brandListCrawler = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            $("div.item-list:nth-of-type(n+2) a").each((_, elem) => {
                src = $(elem).attr("href")
                if (src !== undefined) {
                    brandCrawler.queue({
                        headers: {
                            Cookie: "SSESSconsent=1"
                        },
                        uri: `https://www.watchadvisor.com${src}`,
                        brand: src.split('/')[src.split('/').length - 1],
                    });
                }
            });
        }

        done();
    }
});

brandListCrawler.queue({
    headers: {
        Cookie: "SSESSconsent=1"
    },
    uri: `https://www.watchadvisor.com/en/brands`,
});
