
/*var fuzzyOptions = {
  searchClass: "fuzzy-search",
  location: 0,
  distance: 10000,
  threshold: 0.4,
  multiSearch: true
};//*/
// initialise article list
var articles = new List("content", {
	valueNames: ["title_link", "title_text", "date", "href", "content", "category"],
	listClass: "list",
	searchClass: "search",
	//plugins: [ ListFuzzySearch() ],
	sortFunction: function(a, b, options) {
		m = (options.order == "desc") ? 1 : -1;
		if (a._values.date == "") return -m;
		if (b._values.date == "") return m;
		return m * b._values.date.localeCompare(a._values.date);
	}
});
// limit display to 11 articles and hope the pagination will work
articles.show(1, 11);

// fill up the article list
jQuery.getJSON('/articles.json', function(data)
	{
		// Add the articles to listjs and redo pagination
		articles.show(1, articles.size());
		for(i=0, len=data.length; i<len; i++) {
			if (articles.get('date', data[i].date).length == 0) {
				articles.add(data[i]);
			}
		}
		navigate();
	}
);

function showArticle(href) {
	var article = articles.get("href", href)[0].values();
	jQuery("#list").hide();
	jQuery("#full-article").html("<h1>" + article.title_text + "</h1><div>" + article.content + "</div>").show();
}

function showCategory(category, page) {
	if (page === undefined) page = 1;
	articles.sort("date", {order: "desc"});
	articles.filter(function(item) {
		if (category == "accueil" || item.values().category == category) {
			return true;
		}
		return false;
	});
	articles.show(10 * (page - 1) + 1 + (page==1?0:1), (page==1?11:10)); // tested
	jQuery("#list").show();
	jQuery("#full-article").hide();
	makePagination(page);
}

function makePagination(page) {
	jQuery(".pagination").remove();
}

navigate = function(e) {
	var bits = location.href.split("/");
	var categ = "";
	url = "";
	bits.splice(0, 3);
	if (bits[0] == "posts") { // article asked for
		categ = bits[1];
		if (categ.match(/^[0-9]{4}$/)) categ = "";
		url = "/" + bits.join("/");
	}
	else { // category list asked for
		if (bits[0] == "page") {
			categ = "";
			page = bits[1];
		}
		else {
			categ = bits[0];
			page = bits.length > 2 ? bits[2] : 1;
		}
		//console.log(page);
	}
	if (categ == "") categ = "accueil";
	
	if (url) {
		showArticle(url);
	}
	else {
		showCategory(categ);
	}
	
	jQuery("nav a").removeClass("active");
	jQuery("#"+categ).addClass("active");
	return true;
};
$(window).on('popstate', navigate);

// site navigation
jQuery("a").click(function(e){
	server = location.href.split('/')[2];
	if (e.target.href.indexOf(server) >= 0) {
		e.preventDefault();
		//$.scrollTo('#content', 800);
		history.pushState(null, null, e.target.href);
		navigate(e);
		return false;
	}
});

// give searches the full list
jQuery("nav .input img").click(function(e){
	history.pushState(null, null, "/");
	navigate(e);
});

jQuery("nav input").on("keyup", function (e) {
	if (e.which === 13) {
		history.pushState(null, null, "/");
		navigate(e);
	};
});