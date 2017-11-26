var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var crawler = require('./public/js/crawler.js');
const rl = require('readline');
var synaptic = require('synaptic');
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var inLayer = new Layer(4);
var hLayer = new Layer(3);
var outLayer = new Layer(1);

inLayer.project(hLayer);
hLayer.project(outLayer);

var testNet = new Network({
	input: inLayer,
	hidden: [hLayer],
	output: outLayer
});

var lrate = 0.2;

const r = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

var sQuery = null;
var words = null;
//var visited = [];
var visited = {"http://www.leatherfoot.com" : []}; //{url_root : [internal, internal, ...]}
var to_visit = {"http://www.leatherfoot.com" : []};
var rootUrl = null;

var global_tags = [0,0,0,0,0,0];

var tags_meta,
    tags_a,
    tags_header,
    tags_title,
    tags_div,
    tags_all,
    pageCount = 0;

var requests = 0;
var request_delay = 0;

var trainDataSet = {}; //{site : [dataset]}
var curr_data = null;

r.question('Enter a website to crawl: ', (input) => {
    //if(!input.includes('http://www.'))
      //  input = 'http://www.' + input;

    r.question('Enter a search query: ', (query) =>{
        sQuery = query;

        var results = getQueryURLS();
        var x = 0;

        if (sQuery){
            words = sQuery.split(" ").filter(function(value, index, self) { 
                return self.indexOf(value) === index;
            });
        }

        /*for(result in results){
        	rootUrl = results[result];
        	console.log('visiting: ' + results[result]);
        	makeRequest(results[result], function(data){
        		console.log('pushing');
        		pushDataToSet(rootUrl, data);
        	});
    	}*/

    	depthRequest(results[0], results[0], 1);
    	

        r.close();
    });
});

function getQueryURLS(){
	return ["http://www.leatherfoot.com",
			//"http://www.thebay.com/webapp/wcs/stores/servlet/en/thebay/search/shoes/mens-shoes",
			"http://www.blogto.com/toronto/the_best_shoe_stores_in_toronto/",
			"http://www.davidsfootwear.com",
			//"http://www.brownsshoes.com/",
			"http://www.capezioshoes.ca",
			//"http://www.aldoshoes.com/ca/en/women/clearance",
			"http://www.aldoshoes.com",
			//"http://www.stacyadams.ca/"
			];
}

function depthRequest(url_root, url, depth){
	var curr_tags = [0,0,0,0,0,0];

	url = url.replace(new RegExp("^https?://"), '');

	console.log("depth: " + depth)
	console.log(visited[url_root]);

	if(visited[url_root].includes("http://" + url)){
		console.log("has been visited, returning");
		return;
	}

	if(depth > 2){
		console.log("maximum recursion depth exceeded");
		return;
	}

	visited[url_root].push("http://" + url);

	//pause
	request_delay = new Date(new Date().getTime() + 3 * 1000)
                    while(request_delay > new Date()){}

	request("http://" + url, function(err, res, data){
		if(err) {
          console.log("Error: " + err);
          return;
        }

        if(res.statusCode === 200) {
        	var $ = cheerio.load(data);

            let pageLinks = crawler.getLinks($, url_root);

            to_visit[url_root] = to_visit[url_root].concat(pageLinks['i']);
            
            curr_tags[0] += $('meta').length; //todo: set tag values appropriatley
            curr_tags[1] += $('a').length;
            curr_tags[2] += $('h1').length + $('h2').length + $('h3').length + $('h4').length + $('h5').length + $('h6').length;
            curr_tags[4] += $('div').length;

            /*for(tag in curr_tags){
				global_tags[tag] += curr_tags[tag];
			}*/


			var c = 0;
			while(to_visit[url_root].length > 0){
				console.log("globals");
				console.log(global_tags);
				console.log("visiting: " + url_root + to_visit[url_root][to_visit[url_root].length - 1]);
				//console.log(to_visit[url_root]);
				depthRequest(url_root, url_root + to_visit[url_root].pop(), depth + 1);
				c++;
			}

			console.log("globals");
			console.log(global_tags);
		}
	});

}

function makeRequest(visit){

    request(visit, function(err, res, data) {
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
            tags_all += tags_meta + tags_div + tags_a;

            /*for(var i = 0; i < words.length; i++){
                console.log("Searching for word: " + words[i])
                let s = crawler.getWords($, words[i]);
                console.log(s)
            }*/

            for(var i = 0; i < pageLinks['i'].length && requests < 10; i++){
                /*this makes all the requests from the current set of internal links simultaneously,
                 and returns the data from that set simultaneously*/
            	if(pageLinks['i'] && visited.indexOf(pageLinks['i'][i]) == -1){
                    requests ++;
                    visited.push(pageLinks['i'][i]);
                    request_delay = new Date(new Date().getTime() + 2 * 1000)
                    while(request_delay > new Date()){}
                    console.log("making request number: " + requests);
                    makeRequest(rootUrl + pageLinks['i'][i])
            	}
            }

            if(visit == rootUrl){
	            curr_data = [all_links.length/10, tags_meta/tags_all, tags_div/tags_all, tags_a/tags_all];
	  			cb(curr_data);
	  		}
        }
    });
}

function pushDataToSet(url, data){
	trainDataSet[url] = data;
	console.log(trainDataSet);

	if(Object.keys(trainDataSet).length >= 5){
		console.log('training');
		console.log(trainDataSet);

		for(var i = 0; i < 2000; i++){
    		for(tData in trainDataSet){
    			console.log('training');
    			trainNN(trainDataSet[tData], lrate, [Object.keys(trainDataSet).indexOf(tData)/5]);
    		}
    	}

    	for(tData in trainDataSet){
    		console.log(testNet.activate(tData)); //hopefully 1,2,3...
    	}

	}
}

function trainNN(data, rate, expectation){
	testNet.activate(data);
	testNet.propagate(rate, expectation);
}