require.config({
	baseUrl: 'js',
	paths: {
		flotyum: 'ext/jquery.flot.JUMlib',
		flotgantt: 'ext/jquery.flot.gantt',
		flottime: 'ext/jquery.flot.time',
		flotmouse: 'ext/jquery.flot.mouse',
		flotselect: 'ext/jquery.flot.selection.min',
		flot: 'ext/jquery.flot.min',
		tablesorter: 'ext/jquery.tablesorter.min',
		palette: 'ext/chroma.palette-gen',
		chroma: 'ext/chroma',
		jquery: 'ext/jquery-2.1.0.min',
		datgui: 'ext/dat.gui.min'
	},
	shim: {
		'flotgantt': ['flottime', 'flot', 'flotyum', 'flotmouse'],
		'flottime' : ['flot', 'flotyum'],
		'flotmouse' : ['flot', 'flotyum'],
		'flotyum' : ['flot'],
		'flotselect': ['flot'],
		'flot': ['jquery'],
        	'palette': ['chroma']
	}
});

require(["timeline", "herostats", "teamstats", "herocombos", "records", "totals", "data-container", "jquery"], function(Timeline, HeroStats, TeamStats, HeroCombos, Records, Totals, DataContainer) {	
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
			$("#table,#chart,#tooltip").hide();
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
		var li4 = menuItem("Records", "records", new Records(data));
		var li5 = menuItem("Totals", "totals", new Totals(data));
		var li6 = menuItem("Hero combos", "herocombos", new HeroCombos(data));
		$("#menu").append($("<ul>").append(li).append(li2).append(li3).append(li4).append(li5).append(li6));
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
