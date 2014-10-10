//(function(){
	var perPage = 10;
	var menu = document.getElementById("menu");
	
	// initialise article list
	var articles = new List("content", {
		valueNames: ["title_link", "title_text", "date", "href", "content", "readmore", "readmore-link", "category"],
		listClass: "list",
		searchClass: "search",
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
	var getjson = new XMLHttpRequest();
	getjson.onreadystatechange = function() {
		if (getjson.readyState == 4 && getjson.status == 200) {
			var articles = JSON.parse(getjson.responseText);
			addArticles(articles);
		}
	}
	getjson.open("GET", '/articles.json', true);
	getjson.send();

	function addArticles(data) {
		// Add the articles to listjs and redo pagination
		articles.show(1, articles.size());
		for(i=0, len=data.length; i<len; i++) {
			if (articles.get('href', data[i].href).length == 0) {
				articles.add(data[i]);
			}
		}
		navigate(true);
	}

	function showArticle(href) {
		matches = articles.get("href", href);
		if (matches.length == 0) return false;
		var article = matches[0].values();
		document.getElementById("list").style.display = "none";
		document.getElementById("pagination").style.display = "none";
		var full_article = document.getElementById("full-article");
		full_article.innerHTML = "<h1>" + article.title_text + "</h1><div>" + article.content + article.readmore + "</div>";
		full_article.style.display = "block";
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
		articles.show(10 * (page - 1) + 1 + (page==1?0:1), (page==1?perPage+1:perPage));
		document.getElementById("list").style.display = "block";
		document.getElementById("pagination").style.display = "block";
		document.getElementById("full-article").style.display = "none";
		makePagination(category, page);
	}

	function makePagination(category, page) {
		var pagination = document.getElementById("pagination");
		if (pagination !== null) {
			pagination.innerHTML = "";
		} else {
			document.getElementById("content-column").innerHTML += '<div id="pagination" class="pagination"></div>';
			pagination = document.getElementById("pagination");
		}
		
		if (category == "accueil") {
			var total = articles.size();
		} else {
			var total = articles.get("category", category).length;
		}
		//console.log(total);
		
		href = location.href;
		pos = href.indexOf("/page/");
		if (pos >= 0) {
			href = href.substr(0, pos);
		} else if (category != "accueil") {
			href += "?";
			total = total - 1; // the extra article on the front page
		}
		if (href.substr(-1) != "/") href += "/";
		href += "page/";
		//console.log(href);
		//console.log(total);
		
		var links = "";
		if (page > 1) {
			// make prev link
			links += '<a href="' + href + (page - 1) + '" class="nav-prev">&lt; Articles précédents</a>';
		}
		if (page < total/perPage) {
			// make next link
			links += '&nbsp;<a href="' + href + (parseInt(page) + 1) + '" class="nav-next">Articles suivants &gt;</a>';
		}
		
		pagination.innerHTML = links;
	}

	navigate = function(noscroll) {
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
			if (bits[0] == "page") { //accueil
				categ = "";
				page = bits.length > 1 ? bits[1] : 1;
			}
			else { //category/?/page/x
				categ = bits[0];
				page = bits.length > 3 ? bits[3] : 1;
			}
			//onsole.log(page);
		}
		if (categ == "") categ = "accueil";
		
		if (url) {
			showArticle(url);
		}
		else {
			showCategory(categ, page);
		}
		
		var links = menu.getElementsByTagName("a");
		for(i = 0, len = links.length; i < len; i++) {
			links[i].className = ""; // remove "active";
		}
		//console.log(categ);
		document.getElementById(categ).className = "active";
		
		if (noscroll !== true) menu.scrollIntoView(true);
		
		return true;
	};
	window.addEventListener('popstate', navigate, false);

	// site navigation
	document.addEventListener("click", linkClick, true);
	function linkClick(e){
		if(e.target.nodeType != 1 || e.target.tagName.toLowerCase() !="a") return true;
		var href = e.target.href;
		//console.log(href);
		
		var local = false;
		// don't try treating these links
		if (href.substr(0, 7) == "mailto:") return true;
		if (href.substr(0, 4) == "tel:") return true;
		
		if (href.substr(0, 7) == "http://" || href.substr(0, 8) == "https://" || href.substr(0, 2) == "//") {
			var server = location.href.split('/')[2];
			if (href.indexOf(server) >= 0) local = true;
		}
		if (local) {
			link = e.target;
			if (href.split("?")[0].substr(-4).toLowerCase() == ".pdf") {
				if (!link.hasAttribute("target")) {
					link.setAttribute("target", "_blank");
					
					// Cancel action and regenerate a click - otherwise the target attribute isn't used
					e.preventDefault();
					if (document.createEvent) { // Firefox
						var event = document.createEvent("MouseEvents");
						event.initEvent("click", true, true);
						link.dispatchEvent(event);
					}	else if (link.click) { // IE
						link.click();
					} else {
						console.log("no click method");
					}
					return false;
				}
			} else {
				e.preventDefault();
				//$.scrollTo('#content', 800);
				history.pushState(null, null, href);
				navigate();
				return false;
			}
		} else {
			// TODO check for dropbox links
		}
	};

	// give searches the full list
	document.getElementById("do-search").addEventListener("click", searchFullList, false);
	document.getElementById("search-input").addEventListener("keyup", searchFullList, false);
	document.getElementById("search-input").addEventListener("input", searchFullList, false);
	
	function searchFullList(e) {
		if (e.type !== 'keyup' || e.which === 13) {
			history.pushState(null, null, "/");
			navigate();
		};
	};

//})();

// Audio
(function(){
	var player = document.getElementById("audio-player");
	var progress = document.getElementById("audio-progress");
	var button = document.getElementById("playpause");
	var duration = 0;

	// control button
	button.addEventListener("click", playpause, false);
	function playpause() {
		if (player.paused) {
			player.play();
			button.style.backgroundPosition = "0% 100%";
		} else {
			player.pause();
			button.style.backgroundPosition = "0% 0%";
		}
	}

	// audio progress display
	player.addEventListener("canplaythrough", function () {
		duration = player.duration;
	}, false);

	player.addEventListener("timeupdate", updateProgress, false);
	function updateProgress() {
		if (duration == 0) duration = player.duration;
		var playPercent = 100 * (player.currentTime / duration);
		progress.style.backgroundPosition = (100 - playPercent) + "% 0%";
	};

	// navigation
	function play(which) {
		var list = document.getElementById("audio-list").children;
		var len = list.length;
		var current = undefined;
		for (i = 0; i < len; i++) {
			if (list[i].className == "playing") current = i;
		}
		if (current == undefined) return;
		if (which == "prev") {
			next = current - 1;
			if (next < 0) next = len - 1;
		} else {
			next = current + 1;
			if (next > len - 1) next = 0;
		}
		playpause();
		list[current].className = ""; // remove "playing"
		list[next].className = "playing";
		player.src = list[next].getElementsByClassName("audio-link")[0].href;
		playpause();
	}

	player.addEventListener("ended", function() {
		play("next");
	}, false);

	document.getElementById("audio-next").addEventListener("click", function(e) {
		play("next");
		return false;
	}, false);

	document.getElementById("audio-prev").addEventListener("click", function(e) {
		play("prev");
		return false;
	}, false);

	// seeking
	progress.addEventListener("click", function (e) {
		if(e.offsetX == undefined) { // this works for Firefox
			var xpos = e.pageX-progress.offsetLeft;
			if (obj = progress.offsetParent) {
				do {
					xpos -= obj.offsetLeft;
				} while (obj = obj.offsetParent);
			}
		} else {										 // works in Google Chrome
			var xpos = e.offsetX;
		}
		var percent = xpos / e.target.clientWidth;
		player.pause();
		player.currentTime = player.duration * percent;
		player.play();
		updateProgress();
	}, false);
	
	// visibility detection
	function getHiddenProp(){
    if ('hidden' in document) return 'hidden';
    
    var prefixes = ['webkit','moz','ms','o'];
    for (var i = 0; i < prefixes.length; i++){
			if ((prefixes[i] + 'Hidden') in document) 
				return prefixes[i] + 'Hidden';
    }

    return null;
	}
	function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;
    
    return document[prop];
	}
	var visProp = getHiddenProp();
	if (visProp) var visEvent = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
	function visChange() {
		if (!isHidden()) {
			// play and remove visEvent
			playpause();
			document.removeEventListener(visEvent, visChange);
		}
	}

	if (!isHidden()) {
		playpause();
	} else { // use the property name to generate the prefixed event name
		document.addEventListener(visEvent, visChange);
	}
})();