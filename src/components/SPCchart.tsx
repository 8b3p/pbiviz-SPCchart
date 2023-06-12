import * as React from 'react';
import { useRef, useLayoutEffect } from 'react';
import { max, min, scaleTime, scaleLinear, axisBottom, axisLeft, select, line, axisRight, format, forceSimulation, forceX, forceY, forceCollide } from 'd3'
import * as d3Tip from 'd3-tip';

export interface IData {
  categorical: {
    date: Date;
    value: number;
    color?: string;
  }[];
  upperLimit: number;
  lowerLimit: number;
  std: number;
  target: number;
  median: number;
}

export interface VisualSettings {
  general: {
    textSize: number;
    circleRadius: number;
    showTitle: boolean;
  },
  margins: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  }
}

interface props {
  data?: IData;
  width: number;
  height: number;
  settings: VisualSettings;
}

const SPCChart = ({
  data,
  width,
  height,
  settings: {
    general: {
      textSize,
      circleRadius,
      showTitle
    },
    margins: {
      marginTop,
      marginRight,
      marginBottom,
      marginLeft
    }
  }
}: props) => {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!data) return;
    const Width = width - marginLeft - marginRight;
    const Height = height - (document.getElementById('extraContent') && document.getElementById('extraContent').offsetHeight) - marginTop - marginBottom;

    data.categorical = data.categorical.filter(d => {
      return d.date && d.value;
    })

    const dateOffset = max(data.categorical, d => d.date).getTime() - min(data.categorical, d => d.date).getTime() as number / 10;
    const dateRange = [new Date(min(data.categorical, d => d.date).getTime() - dateOffset), new Date(max(data.categorical, d => d.date).getTime() + dateOffset)];

    const x = scaleTime()
      .domain(dateRange)
      .range([0, Width])

    const maxValue = max([max(data.categorical, d => d.value), data.upperLimit, data.lowerLimit + data.std])
    const minValue = min([min(data.categorical, d => d.value), data.lowerLimit, data.upperLimit - data.std])
    const dataOffset = (maxValue - minValue) / 10;
    const y = scaleLinear()
      .domain([minValue - dataOffset, maxValue + dataOffset])
      .range([Height, 0])
      .nice(10)

    const rightY = scaleLinear()
      .domain([minValue - dataOffset, maxValue + dataOffset])
      .range([Height, 0])
      .nice(10)

    chartRef.current.innerHTML = "";

    const svg = select(chartRef.current)
      .attr("viewBox", `0 0 ${Width + marginLeft + marginRight} ${Height + marginTop + marginBottom}`)
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

    //target line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.target))
      .attr("y2", y(data.target))
      .attr("stroke", "black")

    //median line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.median))
      .attr("y2", y(data.median))
      .attr("stroke", "black")

    // Draw minimum lines
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.lowerLimit))
      .attr("y2", y(data.lowerLimit))
      .attr("stroke", "green")
      .attr("stroke-dasharray", "3 3");

    // Draw upper STD line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.upperLimit - data.std))
      .attr("y2", y(data.upperLimit - data.std))
      .attr("stroke", "blue")
      .attr("stroke-dasharray", "3 3");

    // Draw lower STD line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.lowerLimit + data.std))
      .attr("y2", y(data.lowerLimit + data.std))
      .attr("stroke", "blue")
      .attr("stroke-dasharray", "3 3");

    // Draw maximum lines
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", Width)
      .attr("y1", y(data.upperLimit))
      .attr("y2", y(data.upperLimit))
      .attr("stroke", "red")
      .attr("stroke-dasharray", "3 3");

    // Add tooltip for data points
    // @ts-ignore
    const tip = d3Tip.default()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function(d: any) {
        const data = d.target.__data__
        return `Value: ${data.value} <br> Date: ${new Date(data.date).toLocaleTimeString()} ${new Date(data.date).toLocaleDateString()}`;
      });

    svg.append("path")
      .datum(data.categorical)
      .attr("class", "data-line")
      .attr("d", line())
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    // Draw data points
    svg.selectAll("circle")
      .data(data.categorical)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", circleRadius)
      .attr("fill", (d) => d.color)
      .on("mouseover", tip.show) // Show tooltip on mouseover
      .on("mouseout", tip.hide) // Hide tooltip on mouseout
      .call(tip); // Attach tooltip to chart elements

    // Create label data
    const labels = data.categorical.map((d, i) => ({
      x: x(d.date),
      y: y(d.value),
      id: i,
      label: `${d.value}`,
      date: d.date,
      value: d.value
    }));

    // Create lines
    const lines = svg.selectAll('.label-line')
      .data(labels)
      .enter()
      .append('line')
      .attr('class', 'label-line')
      .attr('x1', (d) => x(d.date))
      .attr('y1', (d) => y(d.value))
      .attr('x2', (d) => d.x)
      .attr('y2', (d) => d.y)
      .attr('stroke', 'black');


    // Create force simulation
    forceSimulation(labels)
      .force("x", forceX().strength(0.2).x((d) => d.x))
      .force("y", forceY().strength(0.2).y((d) => d.y))
      .force("collide", forceCollide(circleRadius * 4)) // Use larger radius for collision
      .on("tick", ticked);

    // Function to reposition labels on each simulation tick
    function ticked() {
      const u = svg
        .selectAll('.data-label')
        .data(() => { return labels })

      u.enter()
        .append('text')
        .attr('class', 'data-label')
        .text((d) => d.label)
        .merge(u as any)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)

      u.exit().remove()

      // Update line positions
      lines
        .attr('x1', (d) => x(d.date))
        .attr('y1', (d) => y(d.value))
        .attr('x2', (d) => d.x)
        .attr('y2', (d) => d.y)
    }

    // Draw x-axis
    svg.append("g")
      .attr("transform", `translate(0, ${Height})`)
      .attr("style", `font-size: ${textSize}em`)
      .call(axisBottom(x).ticks(6)
      )

    // Draw vertical lines on each tick of the x-axis
    svg.selectAll(".vertical-line")
      .data(x.ticks())
      .enter()
      .append("line")
      .attr("class", "vertical-line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", 0)
      .attr("y2", Height)
      .attr("stroke", "lightgray")
      .attr("stroke-dasharray", "2 2");

    // Draw y-axis
    svg.append("g")
      .attr("style", `font-size: ${textSize}em`)
      .call(axisLeft(y));

    // Draw y-axis on the right
    const yAxis = svg.append("g")
      .attr("transform", `translate(${Width}, 0)`)
      .attr("style", `font-size: ${textSize}em`)
      .call(axisRight(rightY)
        .tickValues([data.upperLimit, data.lowerLimit + data.std, data.target, data.upperLimit - data.std, data.lowerLimit])
        .tickFormat((d, i) => { if (Number.isInteger(d as number)) { return format('d')(d); } else { return format('.2f')(d); } })
      );
    yAxis.selectAll(".tick text")
      .style("fill", function(d, i) {
        switch (i) {
          case 0: return "red";
          case 1: return "blue";
          case 3: return "blue";
          case 4: return "green";
          default: return "black";
        }
      });

  }, [data, height, width, marginTop, marginRight, marginBottom, marginLeft, textSize, showTitle, circleRadius]);


  return (
    <div style={{ width: width, height: height }}>
      <div id="extraContent">
      </div>
      <div ref={containerRef} style={{ height: `calc(100% - ${document.querySelector('h1') && document.querySelector('h1').offsetHeight}px)`, width: '100%' }}>
        <svg ref={chartRef} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
          <g></g>
        </svg>
      </div>
    </div>
  );
};

export default SPCChart;
