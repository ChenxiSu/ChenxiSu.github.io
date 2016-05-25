var ChinaData = new Array();
var USData = new Array();
var monthInfo, AQIInfo, cityInfo;
var fiveCities = ["Beijing", "Chengdu", "Guangzhou", "Shanghai", "Shenyang"];
var color = ["#dd3497", "#6a51a3"];

// var padding4 = 30;
// var height4 = d3.select("#comparison")[0][0].offsetHeight;
// var width4 = d3.select("#comparison")[0][0].offsetWidth;

var height4 = 500;
var width4 = 900;
var padding4 = 50;

console.log("height2 is: "+height4);
console.log("width2 is" +width4);

d3.select("#menuOf5Cites")
.append("select")
.attr("id", "selectCity")
.selectAll("option")
.data(fiveCities)
.enter()
.append("option")
.text(function (d) { return d; });

var svg4 = d3.select("#comparison").append("svg").attr("height", height4).attr("width", width4);

d3.csv("data/comparison.csv", function (error, data) {
	monthInfo = data;
	months = monthInfo.map(function (info) {
		return {
			site: info["City"],
			year: Number(info["Year"]),
			month: Number(info["Month"]),
			from: info["Source"],
			quality: Number(info["PM2.5"])
		};
	})

	for (var i = 0; i < fiveCities.length; i++) {
		ChinaData[i] = months.filter(function (d) { return d.site == fiveCities[i] && d.from == "China"; });
		USData[i] = months.filter(function (d) { return d.site == fiveCities[i] && d.from == "US"; });
	}

	xScale = d3.scale.linear().domain([1, 12]).range([padding4, width4 - padding4]);
	yScale = d3.scale.linear().domain([0, d3.max(months, function (d) { return d.quality; })]).range([height4 - padding4, padding4]);

	var xAxis = d3.svg.axis().scale(xScale).ticks(12);
	svg4.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height4 - padding4) + ")").call(xAxis);

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	svg4.append("g").attr("class", "axis").attr("transform", "translate(" + padding4 + ", 0)").call(yAxis);

	svg4.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width4 / 2) + ", " + (height4 - (padding4 / 4)) + ")")
    .text("Month");

    svg4.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding4 / 4) + ", " + (height4 / 2) + ") rotate(-90)")
    .text("PM2.5 Value");

    drawLine4(ChinaData[0], 0);
    drawLine4(USData[0], 1);
    drawLegend4();
});

d3.select("#selectCity").on("change", function () {
	var key = this.selectedIndex;
	d3.select("#comparison").selectAll("path").remove();

	var xAxis = d3.svg.axis().scale(xScale).ticks(12);
	svg4.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height4 - padding4) + ")").call(xAxis);

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	svg4.append("g").attr("class", "axis").attr("transform", "translate(" + padding4 + ", 0)").call(yAxis);

	drawLine4(ChinaData[key], 0);
	drawLine4(USData[key], 1);
	drawLegend4();
});

var drawLine4 = function (data, i) {
	var line = d3.svg.line()
	.x(function (d) { return xScale(d.month); })
	.y(function (d) { return yScale(d.quality); });

	var path = svg4.append("path").attr("class", "line").attr("d", line(data)).style("stroke", color[i]);
	var totalLength = path.node().getTotalLength();
	// Animation
	path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(800)
    .ease("linear")
    .attr("stroke-dashoffset", 0);
}

var drawLegend4 = function () {
	svg4.append("rect")
    .attr("x", 100).attr("y", 50).attr("width", 150).attr("height", 70)
    .style("stroke", "black").style("fill", "#eee").style("stroke-width", 1.5);

    svg4.append("path")
    .attr("d", "M 120, 70 L 150, 70").style("stroke", color[0]);

    svg4.append("path")
    .attr("d", "M 120, 100 L 150, 100").style("stroke", color[1]);

    svg4.append("text")
    .attr("x", 160).attr("y", 70).text("Chinese Data")
    .style("font-size", 12).style("dominant-baseline", "middle");

    svg4.append("text")
    .attr("x", 160).attr("y", 100).text("US Data")
    .style("font-size", 12).style("dominant-baseline", "middle");
}