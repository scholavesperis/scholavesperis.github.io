//(function(){
	// enable HTML5-History-API for IE<10
	//var blocation = window.history.location || window.location;
	var category = "";
	var view = "list";

	// initialise article list
	var articles = new List("content", {
		valueNames: ["title", "title_text", "id", "href", "content", "category", "date"],
		listClass: "list",
		sortFunction: function(a, b, options) {
			m = (options.order == "desc") ? 1 : -1;
			if (a._values.id == "") return -m;
			if (b._values.id == "") return m;
			return m * b._values.id.localeCompare(a._values.id);
		}
	});
	// limit display to 11 articles and hope the pagination will work
	articles.show(1,Math.min(11, articles.size()));

	// fill up the article list
	jQuery.getJSON('/articles.json', function(data)
		{
			// Add the articles to listjs and redo pagination
			jQuery(".pagination").remove();
			articles.show(1, articles.size());
			for(i=0, len=data.length; i<len; i++) {
				if (articles.get('id', data[i].id).length == 0) {
					articles.add(data[i]);
				}
			}
		}
	);
	
	function showCategory(which, page) {
		if (page === undefined) page = 1;
		category = which;
		articles.sort("id", {order: "desc"});
		articles.filter(function(item) {
			if (category == "accueil" || category == "" || item.values().category == category) {
				return true;
			}
			return false;
		});
		articles.show(10 * (page - 1) + 1 + (page==1?0:1),(page==1?11:10));
		jQuery("#list").show();
		jQuery("#full-article").hide();
	}
	
	function showArticle(href) {
		//console.log("articles.get('href', '"+href+"')");
		var article = articles.get("href", href)[0].values();
		//console.log("hide list");
		jQuery("#list").hide();
		//console.log("show article");
		jQuery("#full-article").html("<h1>" + article.title_text + "</h1><div>" + article.content + "</div>").show();
	}
	
	navigate = function(e) {
		//console.log("navigate to " +location.href);
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
		//console.log("category = '"+categ+"'");
		
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
//})();