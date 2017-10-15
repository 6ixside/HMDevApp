var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var crawler = require('./public/js/crawler.js');
const rl = require('readline');

const r = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

var sQuery = null;
var words = null;
var visited = [];
var all_links = [];
var rootUrl = null;

var tags_meta,
    tags_a,
    tags_header,
    tags_title,
    tags_div,
    pageCount = 0;

var requests = 0;

r.question('Enter a website to crawl: ', (input) => {
    //if(!input.includes('http://www.'))
      //  input = 'http://www.' + input;

    rootUrl = input;

    r.question('Enter a search query: ', (query) =>{
        sQuery = query;

        getQueryURLS(sQuery);

        /*if (sQuery){
            words = sQuery.split(" ").filter(function(value, index, self) { 
                return self.indexOf(value) === index;
            });
        }*/
        //console.log('visiting: ' + input);
        //makeRequest(input);
        r.close();
    });
});

function getQueryURLS(q){
    urls = [];
    words = q.split(" ");

    searchUrl = "https://www.google.com/search?q=";

    for (wid in words){
        searchUrl += words[wid] + '+';
    }
    searchUrl = searchUrl.substring(0, searchUrl.length - 1);

    request(searchUrl, function(err, res, data){
        if(err) {
          console.log("Error: " + err);
        }

        console.log('getting search results from: ' + searchUrl);

        if(res.statusCode === 200) {
            // Parse the document body
            var $ = cheerio.load(data);

            console.log($('.srg'));

           /* $('#ires>#rso>._NId').each(function(){
                console.log('test');
                console.log($(this).find('a').attr('href'));
                urls.push($(this).find('a').attr('href'));
            });*/
        }

        console.log(urls);
    });

}

function makeRequest(visit){

    return request(visit, function(err, res, data) {
        if(err) {
          console.log("Error: " + err);
        }

        console.log('visiting: ' + visit);
        //requests++;
    // Check status code (200 is HTTP OK)
        console.log("Status code: " + res.statusCode);
        if(res.statusCode === 200) {
            // Parse the document body
            var $ = cheerio.load(data);

            let pageLinks = crawler.getLinks($);
            all_links.push(pageLinks);

            console.log(pageLinks);

            console.log("Page title:  " + $('title').text());
            //console.log($('html').prop("tagName"));
            console.log('there are ' + $('meta').length + ' meta tags');
            tags_meta += $('meta').length;

            console.log('there are ' + $('div').length + ' div tags');
            tags_div += $('meta').length;

            console.log('there are ' + $('a[href^="/"]').length + ' a tags');
            tags_a += $('meta').length;

            for(var i = 0; i < words.length; i++){
                console.log("Searching for word: " + words[i])
                let s = crawler.getWords($, words[i]);
                console.log(s)
            }

            for(var i = 0; i < pageLinks['i'].length; i++){
                if(requests > 10){
                    console.log('requests exceeded, stopping')
                    break;
                }
                
                /*this makes all the requests from the current set of internal links simultaneously,
                 and returns the data from that set simultaneously*/
                if(pageLinks['i'] && visited.indexOf(pageLinks['i'][i]) == -1){
                    requests ++;
                    visited.push(pageLinks['i'][i]);
                    console.log("making request number: " + requests);
                    makeRequest(rootUrl + pageLinks['i'][i]);
                }
            }
        }
    });
}
