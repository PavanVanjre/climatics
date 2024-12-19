class AverageTemperatureBarChart {
  /**
   * class constructor with basic chart configuration
   * @param {Object} _config
   * @param {Array} _data
   * @param {d3.Scale} _colorScale
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: _config.margin || { top: 5, right: 5, bottom: 20, left: 50 },
      selectedFilters: _config.selectedFilters,
    };
    this.data = _data;
    this.selectedCountry = this.config.selectedFilters.Country;
    this.timePeriod = this.config.selectedFilters["Time Period"];
    this.rcp = this.config.selectedFilters["Emission Rate"];
    this.initVis();
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

    let averageTemparutePercentileData = {};

    averageTemparutePercentileData = this.data.filter(
      (item) =>
        item["Country"] === this.selectedCountry &&
        (item["Category"] === "Temp - Summer Average" ||
          item["Category"] === "Temp - Winter Average") &&
        item["Time Period"] === this.timePeriod &&
        item["Emission Rate"] === this.rcp
    );

    d3.select(vis.config.parentElement)
      .append("h6")
      .style("text-align", "center")
      .style("margin-top", "1rem")
      .text("Percentile Comparison between Summer and Winter Temperatures");

    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .style("display", "block")
      .attr("id", "barchart");

    vis.chart = vis.svg.append("g").attr("transform", `translate(15 ,50)`);

    vis.xAxis = vis.chart
      .append("g")
      .attr("transform", `translate(15,${vis.height})`);

    vis.yAxis = vis.chart.append("g").attr("transform", `translate(15,0)`);

    this.update(this.config.selectedFilters);
  }

  /**
   * this function is used to prepare the data and update the scales before we render the actual vis
   */
  update(currentFilters) {
    let vis = this;
    let categories = ["P5th", "P50th", "P95th"];
    let groups = ["Summer", "Winter"];

    let filteredData = this.data.filter(
      (item) =>
        item["Country"] === currentFilters["Country"] &&
        (item["Category"] === "Temp - Summer Average" ||
          item["Category"] === "Temp - Winter Average") &&
        item["Time Period"] === currentFilters["Time Period"] &&
        item["Emission Rate"] === currentFilters["Emission Rate"]
    );

    // Prepare the data for the bar groups
    let preparedData = groups
      .map((group) => {
        let categoryData = filteredData.find((d) => d.Category.includes(group));
        if (!categoryData) {
          console.log(`No data found for ${group}`);
          return []; // Return empty array if no data found
        }
        return categories.map((cat) => ({
          group,
          category: cat,
          value: categoryData[cat] || 0, // Use 0 as default if undefined
        }));
      })
      .flat();

    if (preparedData.length === 0) {
      console.error("No data available to render the chart.");
      return; // Exit if no data to render
    }

    vis.xScale = d3
      .scaleBand()
      .range([0, vis.width - 20])
      .domain(preparedData.map((d) => `${d.group} ${d.category}`))
      .padding(0.1);

    vis.yScale = d3
      .scaleLinear()
      .range([vis.height, 0])
      .domain([0, d3.max(preparedData, (d) => d.value)]);

    // Update the axes
    vis.xAxis.call(d3.axisBottom(vis.xScale));
    vis.yAxis.call(d3.axisLeft(vis.yScale));

    // Bind data and create bars
    let bars = vis.chart
      .selectAll(".bar")
      .data(preparedData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => 15 + vis.xScale(`${d.group} ${d.category}`))
      .attr("width", vis.xScale.bandwidth() - 2)
      .attr("y", (d) => vis.yScale(d.value) - 5)
      .attr("height", (d) => vis.height - vis.yScale(d.value))
      .attr("fill", (d) => (d.group === "Summer" ? "orange" : "steelblue"));
  }

  /**
   * this function contains the d3 code for binding data to visual elements
   */
  renderVis() {
    let vis = this;
  }
}
