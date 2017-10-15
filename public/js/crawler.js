exports.getWords = function($, word) {
  var bodyText = $('html > body').text();
  var matches = 0;

  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }

  return false;
}

exports.getLinks = function($){
	var links = {}
	var internals = [];
	var externals = [];

	var iLinks = $("a[href^='/']");
	var eLinks = $("a[href^='http']");

	iLinks.each(function(){
		if(internals.indexOf($(this).attr('href')) == -1)
			internals.push($(this).attr('href'));
	})

	eLinks.each(function(){
		if(externals.indexOf($(this).attr('href')) == -1)
			externals.push($(this).attr('href'));
	})

	links['i'] = internals;
	links['e'] = externals;
	return links;
}