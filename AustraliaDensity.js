//Def`ine Margin
var margin = {left: 80, right: 80, top: 50, bottom: 50 }, 
    width = 900 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;


// Define the div for the tooltip
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(-100,30)");

//Define color scale
var cScale = d3.scaleSequential(d3.interpolatePuBu)
    .domain([0, 8000000]);

d3.csv("AustraliaData.csv").then(function(data){ //read population density data from csv file
    console.log(data);
    
    d3.json("gadm36_AUS_1.json").then(function(json){ //read state/territory data from topojson file
        var jsonStateInfo = json.objects.gadm36_AUS_1.geometries;

        console.log(json);
        console.log(json.objects.gadm36_AUS_1);
        var subunits = topojson.feature(json, json.objects.gadm36_AUS_1); // features of Australian states and territories
        console.log(subunits);

        var projection = d3.geoEquirectangular()
                            .fitSize([width*1.4, height*1.4], subunits); // flat map

        var path = d3.geoPath()
            .projection(projection); // creates path according to projection
        
        //merge csv and GeoJSON
        for (var i = 0; i < data.length; i++) {
            //get state/territory name
            var csvName = data[i].name;
            console.log(csvName);

            //get data value, and convert from string to float
            var density = +data[i].density;
            var population = +data[i].population;
            var id = data[i].id;
            //Find the corresponding state inside the TopoJSON
            for (var j = 0; j < jsonStateInfo.length; j++) {

                var jsonName = jsonStateInfo[j].properties.NAME_1;

                if (csvName == jsonName) {
                    //copy csv values in TopoJSON
                    jsonStateInfo[j].properties.density = density;
                    jsonStateInfo[j].properties.population = population;
                    jsonStateInfo[j].properties.id = id;
                    //stop looking through the JSON
                    break;

                }
            }		
        }
        
        console.log(json); //check if JSON file updated

        svg.append("path")
                .datum(subunits)
                .attr("d", path);

        //draw every state/territory
        svg.selectAll(".subunit")
                .data(subunits.features)
        .enter().append("path")
                .attr("d", path)
                .attr("class", function(d) { return "subunit " + d.properties.id; })
                .style("fill", function(d){ return cScale(d.properties.population);
                })
        .on("mouseover", function(d) { //tooltip appears when mouse hovers over state
            if(d.properties.NAME_1){
                console.log(d.properties.NAME_1);
                d3.select(this).attr("class", "highlight");

                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                div.append("div").text(d.properties.NAME_1);
                div.append("div").text("Population: " + d.properties.population);
                div.append("div").text("Density (per sq. mi): " + d.properties.density);
            }
        })
        .on("mouseout", function(d) { //tooltip disappears when mouse stops hovering over state
            d3.select(this).classed("highlight", false);
            div.selectAll("*").remove();
            div.transition()
                .duration(0)
                .style("opacity", 0);
        })
    })
    
        // x-scale and x-axis
        var x = d3.scaleLog()
            .domain([500000, 2600000])
            .range([0, width - margin.right - margin.left]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .tickSize(13)
            .tickValues(cScale.domain())
            .tickFormat('0m');
    
        var g = svg.append("g")
            .attr("transform", "translate(460,40)");
    
        const linearGradient = g.append("linearGradient")
            .attr("id", "linear-gradient");

        // create legend
          linearGradient.selectAll("stop")
            .data(cScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: cScale(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // adjust legend width, height, and gradient fill
          svg.append('g')
            .attr("transform", `translate(400,0)`)
            .append("rect")
            .attr("width", width - margin.right - margin.left)
            .attr("height", 8)
            .style("fill", "url(#linear-gradient)");

        // adds ticks to legend and moves it the same position as legend 
          svg.append('g')
            .attr("transform", `translate(400,0)`)
            .attr("width", width - margin.right - margin.left)
            .call(xAxis)
            .append("text")
                .attr("class", "caption")
                .attr("x", 540)
                .attr("y", -6)
                .attr("fill", "#000")
                .text("Total population");
        
        svg.append('g')
              .append("text")
                .attr("class", "8m")
                .attr("x", 970)
                .attr("y", 23)
                .attr("fill", "#000")
                .attr("font-size", "12px")
                .text("8m");
})