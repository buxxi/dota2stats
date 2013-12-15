define(["jquery", "datgui", "flot", "flotgantt"], function() {
	return function Streaks(DataContainer) {
		var self = this;
		self.container = DataContainer;
		self.type = "win-ratio";
		self.min = 1;
		self.max = 100;
		self.minStreak = 3;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'type', self.container.typeKeys()).onFinishChange(self.draw);
			gui.add(self, 'min', 0, 1000).step(1).onFinishChange(self.draw);
			gui.add(self, 'max', 0, 1000).step(1).onFinishChange(self.draw);
			gui.add(self, 'minStreak', 1, 100).step(1).onFinishChange(self.draw);
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
					gantt: {
						active: true,
						show:true,
						barHeight: 0.2
					}
				},
				grid: { 
					hoverable: true,
					clickable: true
				},
				yaxis: {
					show : false,
					min : 0,
					max : self.container.unfilteredData.length + 1
				},
				xaxis: {
					tickDecimals : 0
				}	
			};
			var chart = $("#chart");
			chart.show();
			var plot = $.plot(chart, self.getFilteredData(), options);
			chart.bind("plothover", function(event, pos, item) {
				$("#tooltip").remove();

				if (item) {
					var itemdata = item.series.data[item.dataIndex];
					var content = itemdata[3] + " games in a row, ended on " + $.plot.formatDate(new Date(itemdata[4]), "%Y-%m-%d");
					$('<div id="tooltip">' + content + '</div>').css({ left: pos.pageX + 5, top: pos.pageY + 5}).appendTo("body").fadeIn(200);	
				}
			});
			
		}

		this.getFilteredData = function() {
			var data = [];
			for (var i in self.container.unfilteredData) {
				var user = self.container.unfilteredData[i];
				if (!self.container.players[user.id].show) {
					continue;
				}

				var type = self.container.types[self.type];
				var result = [];

				user.matches.sort(function(a, b) {
					return Date.parse(a.datetime) - Date.parse(b.datetime);
				});
				var from;
				var count = 0;
				var j = 0;
				var matchdate;				

				for (var k in user.matches) {
					j = k;
					var match = user.matches[j];
					matchdate = match.datetime;
					var value = type.sum([type.calc(match)]);
					if (value < self.min || value > self.max) {
						if (count >= self.minStreak) {
							result.push([from, self.container.unfilteredData.length -i, j, count, matchdate]);
						}
						count = 0;					
					} else if (count == 0) {
						from = j;
						count = 1;
					} else {
						count++;
					}
				}
				if (count > self.minStreak) {
					result.push([from, self.container.unfilteredData.length - i, j, count]);
				}

				var color = self.container.players[user.id].color;
				data.push({data: result, label: user.name, color: color});
			}

			return data;
		}
	};
});
