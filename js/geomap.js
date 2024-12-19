class GeoMapVisualization {
  /**
   * class constructor with basic chart configuration
   * @param {Object} _config
   * @param {Array} _data
   * @param {d3.Scale} _colorScale
   */
  constructor(_config, _data, _geojsonData) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || { top: 25, right: 20, bottom: 20, left: 35 },
    };
    this.data = _data;
    this.fitleredData = null;
    this.geojsonData = _geojsonData;
    this.colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([-30, 40]);
    this.currentFilters = null;
    this.initVis();
    this.probabilityMapping = {
      Median: "P50th",
      "1-In-2 Low": "P5th",
      "1-In-20 High": "P95th",
    };
  }

  /**
   * this function is used to initialize scales/axes and append static elements
   */
  initVis() {
    let vis = this;

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("padding", "10px")
      .style("border", "1px solid #ccc")
      .style("z-index", "2")
      .style("border-radius", "5px");

    this.createLegend();
    let mainDiv = d3.select(vis.config.parentElement);
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .attr("id", "geomap")
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );
    this.renderVis();
  }

  createLegend() {
    let vis = this;
    const legendWidth = 150,
      legendHeight = 20;

    vis.legend = d3
      .select(".interact-card")
      .append("svg")
      .style("margin", "0.4rem")
      .attr("width", 200)
      .attr("height", 50)
      .append("g")
      .attr("transform", "translate(0,0)");

    const defs = vis.legend.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "linear-gradient");

    linearGradient
      .selectAll("stop")
      .data(
        vis.colorScale.ticks().map((t, i, n) => ({
          offset: `${(100 * i) / n.length}%`,
          color: vis.colorScale(t),
        }))
      )
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    vis.legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("transform", "translate(25,0)")
      .style("fill", "url(#linear-gradient)");

    // Add legend text
    vis.legend
      .append("text")
      .attr("class", "legend-text")
      .attr("x", -2)
      .attr("y", 17)
      .text(d3.min(vis.colorScale.domain()));

    vis.legend
      .append("text")
      .attr("class", "legend-text")
      .attr("x", 195)
      .attr("y", 17)
      .attr("text-anchor", "end")
      .text(d3.max(vis.colorScale.domain()));
  }

  update(data, currentFilters) {
    this.data = data; // Update the data with the filtered dataset
    this.currentFilters = currentFilters;
    this.fitleredData = data.reduce((acc, item) => {
      acc[item.Country] = item;
      return acc;
    }, {});

    this.colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain(
        d3.extent(
          data.map((item) =>
            currentFilters &&
            this.probabilityMapping[currentFilters["Probability"]] &&
            item[this.probabilityMapping[currentFilters["Probability"]]]
              ? Number(
                  item[this.probabilityMapping[currentFilters["Probability"]]]
                ) + item["Temperature C"]
              : item["Temperature C"]
          )
        )
      );

    this.renderVis(); // Re-render visualization with new data
  }

  /**
   * this function contains the d3 code for binding data visual elements
   */
  renderVis() {
    let vis = this;

    const projection = d3
      .geoEquirectangular()
      .fitSize([vis.width, vis.height], vis.geojsonData);
    const path = d3.geoPath().projection(projection);
    vis.svg
      .selectAll("path")
      .data(vis.geojsonData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (d) => {
        const countryName =
          d.properties.name == "Russia"
            ? "Russian Federation"
            : d.properties.name;

        if (vis.fitleredData == null) {
          return "#FF0";
        }
        if (!vis.fitleredData[countryName]) {
          return "#FF7"; // Default color when data is missing
        }

        return vis.colorScale(
          vis.currentFilters &&
            this.probabilityMapping[vis.currentFilters["Probability"]] &&
            vis.fitleredData[countryName][
              this.probabilityMapping[vis.currentFilters["Probability"]]
            ]
            ? Number(
                vis.fitleredData[countryName][
                  this.probabilityMapping[vis.currentFilters["Probability"]]
                ]
              ) + vis.fitleredData[countryName]["Temperature C"]
            : vis.fitleredData[countryName]["Temperature C"]
        );
      })
      .attr("opacity", "0.8")
      .attr("stroke", "black")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 3);
        d3.select(this).attr("opacity", 1);
        const countryName =
          d.properties.name == "Russia"
            ? "Russian Federation"
            : d.properties.name;
        const countryData =
          vis.fitleredData && countryName in vis.fitleredData
            ? vis.fitleredData[countryName]
            : null;

        if (countryData) {
          vis.tooltip
            .style("visibility", "visible")
            .html(
              `<div><strong>Country:</strong> ${countryName}<br>
                 <strong>Temperature:</strong> ${countryData["Temperature"]} <br>
                 <strong>Emissions:</strong>  ${countryData["Emissions"]}<br>
                 <strong>Time Period:</strong> ${countryData["Time Period"]} <br>
                 </div>`
            )
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        }
      })
      .on("mousemove", function (event) {
        vis.tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1);
        d3.select(this).attr("opacity", "0.8");
        vis.tooltip.style("visibility", "hidden");
      });
  }
}
