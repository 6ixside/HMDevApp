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

var inLayer = new Layer(6);
var hLayer = new Layer(3);
var outLayer = new Layer(1);

inLayer.project(hLayer);
hLayer.project(outLayer);

var testNet = new Network({
	input: inLayer,
	hidden: [hLayer],
	output: outLayer
});

//var perceptron = new Architect.Perceptron(4,3,1);
//var pTrainer = new Trainer(perceptron);

var lrate = 0.2;

const r = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

var sQuery = null;
var words = null;
//var visited = [];
var visited = {} //{"https://hunterls97.github.io/" : []}; //{url_root : [internal, internal, ...]}
var to_visit = {} //{"https://hunterls97.github.io/" : []};
var rootUrl = null;

var global_tags = {}; //[0,0,0,0,0,0];

var tags_meta,
    tags_a,
    tags_header,
    tags_title,
    tags_div,
    tags_all,
    pageCount = 0;

var requests = 0;
var request_delay = 0;
var totalLinks = 0;
var currLinkQty = 0;
var currentProgress = 0;
var status = 0;

var results = [];

var maxDepth = 2;

var trainDataSet = {}; //{site : [dataset]}
var curr_data = null;

r.question('Enter a website to crawl: ', (input) => {
    //if(!input.includes('http://www.'))
      //  input = 'http://www.' + input;

    r.question('Enter a search query: ', (query) =>{
        sQuery = query;

        results = getQueryURLS();
        console.log(results);

        for(var i in results){
        	visited[results[i]] = [];
        	to_visit[results[i]] = [];
        	global_tags[results[i]] = [0,0,0,0,0,0];
        }

        var x = 0;

        if (sQuery){
            words = sQuery.split(" ").filter(function(value, index, self) { 
                return self.indexOf(value) === index;
            });
        }

    	var next = getNext();
    	next();

        r.close();
    });
});

function getNext(){
	if(results.length > 0){
		console.log('getting next');
		var nextUrl = results.pop();

		var nextCall = function(){
			breadthRequest(nextUrl, nextUrl, 1, function(){

				var r = getNext();
				return r;
			});
		};

		return nextCall;
	}
	else
		return;

}

function getQueryURLS(){
	return ["http://www.leatherfoot.com",
			//"http://www.thebay.com/webapp/wcs/stores/servlet/en/thebay/search/shoes/mens-shoes",
			//"http://www.blogto.com/toronto/the_best_shoe_stores_in_toronto/",
			//"http://www.davidsfootwear.com",
			//"http://www.brownsshoes.com/",
			//"http://www.capezioshoes.ca",
			//"http://www.aldoshoes.com/ca/en/women/clearance",
			//"http://www.aldoshoes.com",
			"https://hunterls97.github.io/"
			//"http://www.stacyadams.ca/"
			];
}

function breadthRequest(url_root, url, depth, cb){
	status++;
	console.log('Status: ' + status);
	var curr_tags = [0,0,0,0,0,0];

	url = url.replace(new RegExp("^https?://"), '');

	console.log("depth: " + depth);
	//console.log(visited[url_root]);

	if(visited[url_root].includes("http://" + url)){
		console.log("has been visited, returning");
		status--;
		return;
	}

	if(depth > maxDepth){
		console.log("maximum recursion depth exceeded");
		status--;
		return;
	}

	visited[url_root].push("http://" + url);

	//pause
	request_delay = new Date(new Date().getTime() + 3 * 1000)
                    while(request_delay > new Date()){}

    if(!(currentProgress == 100.00 && depth >= maxDepth)){
		request("http://" + url, function(err, res, data){
			if(err) {
	          console.log("Error: " + err);
	          status--;
	          return;
	        }

	        if(res.statusCode === 200) {
	        	var $ = cheerio.load(data);

	            let pageLinks = crawler.getLinks($, url_root);

	            to_visit[url_root] = to_visit[url_root].concat(pageLinks['i']);

	            totalLinks += to_visit[url_root].length;
	            
	            curr_tags[0] += $('meta').length; //todo: set tag values appropriatley
	            curr_tags[1] += $('a').length;
	            curr_tags[2] += $('h1').length + $('h2').length + $('h3').length + $('h4').length + $('h5').length + $('h6').length;
	            curr_tags[4] += $('div').length;
	            curr_tags[5] += curr_tags[0] + curr_tags[1] + curr_tags[2] + curr_tags[3] + curr_tags[4];

	            //console.log("current");
				//console.log(curr_tags);

	            for(tag in curr_tags){
					global_tags[url_root][tag] += curr_tags[tag];
				}


				var c = 0;
				while(to_visit[url_root].length > 0 && depth + 1 <= maxDepth){
				//	console.log("globals");
				//	console.log(global_tags);
					console.log("visiting: " + url_root + to_visit[url_root][to_visit[url_root].length - 1]);
					//console.log(to_visit[url_root]);
					breadthRequest(url_root, url_root + to_visit[url_root].pop(), depth + 1, cb);
					c++;
					currLinkQty++;
					currentProgress = (100 * (currLinkQty / totalLinks)).toFixed(2);
					console.log(currLinkQty);
					console.log('Progress: ' + currentProgress + '%');
					//console.log('Status: ' + status);
				}

				if(--status <= 0){
					status = 0;
					totalLinks = 0;
					currLinkQty = 0;

					console.log('status is now 0: ' + status);
					console.log('done');
					console.log(global_tags)
					pushDataToSet(url_root, global_tags[url_root]);
					var callback = cb();

					if(typeof callback == 'function')
						callback();
				}
				else
					console.log('this is the status: ' + status);		
				
				//console.log("globals");
				//console.log(global_tags);
			}
		});
	}
	else
		status--;

	//console.log('this is a test');

}

function pushDataToSet(url, data){
	for(d in data){
		data[d] = data[d] / data[5];
	}

	trainDataSet[url] = data;
	console.log(trainDataSet);

	if(Object.keys(trainDataSet).length >= 2){
		console.log('training');
		console.log(trainDataSet);

		for(var i = 0; i < 2000; i++){
    		for(tData in trainDataSet){
    			//console.log(tData);
    			trainNN(trainDataSet[tData], lrate, [(Object.keys(trainDataSet).indexOf(tData) + 1)/2]);
    		}
    	}

    	for(tData in trainDataSet){
    		console.log('*****outputs*****');
    		console.log(tData);
    		console.log(testNet.activate(trainDataSet[tData]));
    		console.log('*****************');
    		console.log('\n');
    	}

    	//for(tData in trainDataSet){
    		console.log('random sample');
    		console.log(testNet.activate([0.01, 0.5, 0.2, 0, 0.29, 1])); //hopefully 1,2,3...
    	//}

	}
}

function trainNN(data, rate, expectation){
	//console.log('data: ' + data);
	//console.log('rate: ' + rate);
	//console.log('exp: ' + expectation);
	testNet.activate(data);
	testNet.propagate(rate, expectation);
}