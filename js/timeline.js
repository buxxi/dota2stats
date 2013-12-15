define("timeline", ["jquery", "datgui", "flot", "flotselect", "flottime"], function() {
	return function Timeline(DataContainer) {
		var self = this;
	
		self.container = DataContainer;
		self.role = "all";
		self.type = "kills/death";

		self.backtrack = Math.min(100,self.container.maxCount());
		self.matchid = 0;
		self.showSelectedMatch = function() {
			window.open("http://dotabuff.com/matches/" + self.matchid);
		}

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'role', self.container.roleKeys()).onFinishChange(self.draw);
			gui.add(self, 'type', self.container.typeKeys()).onFinishChange(self.draw);
			gui.add(self, 'backtrack', 1, self.container.maxCount()).step(1).onFinishChange(self.draw);
			var players = self.container.players;
			for (var i in players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.add(players[i],'show').onFinishChange(self.draw);
				f.addColor(players[i],'color').onChange(self.draw);
				f.open();
			}
			gui.add(self, 'showSelectedMatch');
			return gui;
		};

		this.draw = function() {
			var options = {
				legend: {
					show: false
				},
				series: {
					lines: { show: true },
					points: { show: true }
				},
				grid: { 
					hoverable: true,
					clickable: true
				},
				xaxis : {
					mode : "time",
					timeformat : "%Y-%m-%d"
				},
				yaxis : {
					tickFormatter : function(val, axis) {
						return self.container.types[self.type].format(val);
					}
				},
				selection: { mode: "x" }	
			};
			var chart = $("#chart");
			chart.show();
			var plot = $.plot(chart, self.getFilteredData(), options);
			chart.bind("plotclick", function(event, pos, item) {
				if (item == null) { return; }
				self.matchid = item.series.data[item.dataIndex][2].matchid;
			});
			chart.bind("plothover", function(event, pos, item) {
				$("#tooltip").remove();

				if (item) {
					var content = $.plot.formatDate(new Date(item.datapoint[0]), options.xaxis.timeformat) + ' = ' + self.container.types[self.type].format(item.datapoint[1]);
					$('<div id="tooltip">' + content + '</div>').css({ left: pos.pageX + 5, top: pos.pageY + 5}).appendTo("body").fadeIn(200);	
				}
			});

			chart.bind("plotselected", function (event, ranges) {
				options.xaxis.min = ranges.xaxis.from;
				options.xaxis.max = ranges.xaxis.to;

				var data = self.getFilteredData();
				var first = true;			
	
				for (var i in data) {
					var line = data[i].data;
					for (var j in line) {
						var dot = line[j];
						if (dot[0] >= options.xaxis.min && dot[0] <= options.xaxis.max) {
							if (first || dot[1] < options.yaxis.min) {
								options.yaxis.min = dot[1];
							}
							if (first || dot[1] > options.yaxis.max) {
								options.yaxis.max = dot[1];
							}
							first = false;
						} 
					}			
				}


				plot = $.plot(chart, data, options);
			});
			chart.bind("plotunselected", function (event) {
				if (!options.xaxis.min && !options.xaxis.max) {
					return;
				}			

				delete options.xaxis.min;
				delete options.xaxis.max;
				delete options.yaxis.min;
				delete options.yaxis.max;

				plot = $.plot(chart, self.getFilteredData(), options);
			});
		};

		this.getFilteredData = function() {
			var data = [];
			for (var i in self.container.unfilteredData) {
				var user = self.container.unfilteredData[i];
				if (!self.container.players[user.id].show) {
					continue;
				}

				var filter = self.container.roles[self.role];
				var type = self.container.types[self.type];
				var result = [];
		
				user.matches.sort(function(a, b) {
					return Date.parse(a.datetime) - Date.parse(b.datetime);
				});

				for (var j in user.matches) {
					var match = user.matches[j];
					if (filter(match)) {
						result.push([Date.parse(match.datetime),self.getAverage(user.matches, j, type), {matchid: match.matchid}]);
					}
				}
				data.push({data: result, label: user.name, color: self.container.players[user.id].color});
			}
			return data;
		};
	
		self.getAverage = function(matches, i, type) {
			var tmp = [];
			for (var j = 0; j < self.backtrack; j++) {
				if (i - j >= 0) {
					tmp.push(type.calc(matches[i - j]));
				}
			}
			return type.sum(tmp);
		};
	};
});
