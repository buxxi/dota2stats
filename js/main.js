require.config({
	baseUrl: 'js',
	paths: {
		flotselect: 'ext/jquery.flot.selection.min',
		flot: 'ext/jquery.flot.min',
		tablesorter: 'ext/jquery.tablesorter.min',
		palette: 'ext/chroma.palette-gen',
		chroma: 'ext/chroma',
		jquery: 'ext/jquery-1.4.2.min',
		datgui: 'ext/dat.gui.min'
	},
	shim: {
		'flotselect': ['flot'],
		'flot': ['jquery'],
        	'palette': ['chroma']
	}
});

require(["timeline", "herostats", "teamstats", "data-container", "jquery"], function(Timeline, HeroStats, TeamStats, DataContainer) {	
	function showFirstPage() {
		var matched = false;

		var links = $("#menu li a");		
		links.each(function() {
			var href = $(this).attr("href");
			var hash = self.location.hash;
			if (href == hash.toString()) {
				$(this).click();
				matched = true;
			}
		});

		if (!matched) {
			links.first().click();
		}
	}	

	function menuItem(text, href, page) {
		var li = $("<li>");	
		var setActive = function() {
			$("#table,#chart").hide();
			$("#menu li").removeClass("active");
			li.addClass("active");	
			$("#gui").empty().append(page.gui().domElement);
			page.draw();
		};
	
		var link = $("<a>");
		link.text(text);
		link.attr("href", "#" + href);
		link.click(setActive);
		li.append(link);
		return li;
	}

	function buildMenu(data) {
		var li = menuItem("Timeline", "timeline", new Timeline(data));
		var li2 = menuItem("Team stats", "teamstats", new TeamStats(data));
		var li3 = menuItem("Hero stats", "herostats", new HeroStats(data));
		$("#menu").append($("<ul>").append(li).append(li2).append(li3));
	}
	
	function fetch() {
		var data = new DataContainer();
		var cancelLoading = setInterval(function() {
			$("#loading").append(".");
		}, 1000);

		var callback = function() {
			buildMenu(data);
			clearInterval(cancelLoading);
			showFirstPage();
		};
		data.load(callback);
	}

	$(document).ready(fetch);
});
