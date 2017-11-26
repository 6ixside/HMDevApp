exports.getWords = function($, word) {
  var bodyText = $('html > body').text();
  var matches = 0;

  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }

  return false;
}

exports.getLinks = function($, url_root){
	var links = {}
	var internals = [];
	var externals = [];

	url_root = url_root.replace(new RegExp("^https?://"), '');

	var iLinks = $("a[href^='/']");
	var eLinks = $("a[href^='http']");

	iLinks.each(function(){
		l = $(this).attr('href');
		l = l.replace(url_root, '');

		if(internals.indexOf(l) == -1)
			internals.push(l);
	})

	eLinks.each(function(){
		l = $(this).attr('href');
		l = l.replace(new RegExp("^https?://"), '');

		if(l.includes(url_root) && internals.indexOf($(this).attr('href')) == -1){
			l = l.replace(url_root, ''); //replace the root url if this is an internal
			internals.push(l);
		}

		if(externals.indexOf(l) == -1)
			externals.push(l);
	})

	links['i'] = internals;
	links['e'] = externals;
	return links;
}