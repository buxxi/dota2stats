define("timeline", ["tooltip","jquery", "datgui", "flot", "flotselect", "flottime"], function(Tooltip) {
	return function Timeline(DataContainer) {
		var self = this;
	
		self.container = DataContainer;
		self.role = "all";
		self.result = "all";
		self.type = "kills/death";

		self.backtrack = Math.min(100,self.container.maxCount());
		self.skip_initial = false;
		self.matchid = 0;
		self.tooltip = new Tooltip(DataContainer);
		self.unselect = false;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'role', self.container.roleKeys()).onFinishChange(self.draw);
			gui.add(self, 'result', self.container.winLossKeys()).onFinishChange(self.draw);
			gui.add(self, 'type', self.container.typeKeys()).onFinishChange(self.draw);
			gui.add(self, 'backtrack', 1, self.container.maxCount()).step(1).onFinishChange(self.draw);
			gui.add(self, 'skip_initial').onFinishChange(self.draw);
			var players = self.container.players;
			for (var i in players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.add(players[i],'show').onFinishChange(self.draw);
				f.addColor(players[i],'color').onChange(self.draw);
				f.open();
			}
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
			chart.unbind().show();
			var plot = $.plot(chart, self.getFilteredData(), options);
			chart.bind("plotclick", function(event, pos, item) {
				if (item == null) { 
					var isShowing = self.tooltip.isShowing();
					self.tooltip.hide();
					
					if (!self.unselect || isShowing) {
						return;
					}

					if (!options.xaxis.min && !options.xaxis.max) {
						return;
					}			

					self.unselect = false;
					delete options.xaxis.min;
					delete options.xaxis.max;
					delete options.yaxis.min;
					delete options.yaxis.max;

					plot = $.plot(chart, self.getFilteredData(), options);
					return;
				} else {
					var value = self.container.types[self.type].format(item.datapoint[1]);
					var header = $.plot.formatDate(new Date(item.datapoint[0]), options.xaxis.timeformat);
					var content = self.type + ": <b>" + value + "</b> over the last " + self.backtrack + " matches";
					self.tooltip.show(pos, content, header, item.series.data[item.dataIndex][2].matchid);
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
			chart.bind("plotunselected", function() {
				self.unselect = true;
			});
		};

		this.getFilteredData = function() {
			var data = [];
	
			var type = self.container.types[self.type];
			var result = [];
			var matches = [];
	
			self.container.filteredData(true, self.role, self.result, 
				function(user, match) {				
					matches.push(match);
					if (!self.skip_initial || matches.length >= self.backtrack) {
						result.push([Date.parse(match.datetime), self.getAverage(matches, type), {matchid: match.matchid}]);
					}			
				}, 
				function (user) {
					data.push({data: result, label: user.name, color: self.container.players[user.id].color});
					matches = [];
					result = [];
				}
			);

			return data;
		};
	
		self.getAverage = function(matches, type) {
			var tmp = [];
			for (var j = 1; j <= self.backtrack; j++) {
				if (matches.length - j >= 0) {
					tmp.push(type.calc(matches[matches.length - j]));
				}
			}
			return type.sum(tmp);
		};
	};
});
