# Using Charts

Because of TypeCells support for React we can use all of the powerful React charting libraries. I'd like to explore two libraries in this demo: <a href="https://vega.github.io/vega-lite/" target="_blank">VegaLite</a> and <a href="https://www.chartjs.org/" target="_blank">Chart.js</a>.

Let's see if we can do something interesting with some live weather data. I've found a public api called <a href="https://open-meteo.com/" target="_blank">Open-Meteo</a> that can provide us with some weather data. For this demo I entered the GPS coordinates of Amsterdam. We can use `fetch` to make the api call and then directly export it's response as a JavaScript object.

```typescript
// Location coordinates of Amsterdam
export let lat = typecell.Input(<input type="text" disabled />, 52.3738);
export let long = typecell.Input(<input type="text" disabled />, 4.891);

export default (
  <div>
    <p>GPS coords</p>
    {lat} <br></br>
    {long}
  </div>
);
```

```typescript
// Make api call and directly convert the response to a JS object
export const weatherData = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${$.lat}&longitude=${$.long}&hourly=temperature_2m,precipitation`
).then((response) => response.json());
```

As you can see in the response we received an hourly rain and temperature forecast for multiple days. For our first chart I'd like to display the amount of rain in mm per hour for the current day.
First we need to transform `hourly.time` and `hourly.precipitation` into a single array of objects. We can map and filter the exported `weatherData` and create a new exported variable called `precipitationData`.

```typescript
export const forecastData = $.weatherData.hourly.precipitation
  // Map to object
  .map((precipitation: number, i: number) => {
    const date = new Date($.weatherData.hourly.time[i]);
    const temperature_2m = $.weatherData.hourly.temperature_2m[i];

    return {
      precipitation,
      date,
      temperature: temperature_2m,
      hour: date.getHours(),
    };
  })
  // Filter objects to only get the hours of today
  .filter(
    (data: { precipitation: number; date: Date; hour: number }) =>
      data.date.getDate() === new Date().getDate()
  );
```

## First chart with VegaLite

Now that we've got some data we can create our first chart! After importing `react-vega` we can use the newly created `$.forecastData` dataset to show the precipitation forecast per hour in a line chart. I also added an additional line to display the current time in the chart.

```typescript
import { VegaLite } from "react-vega";

const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  autosize: "fit",
  width: "700",
  layer: [
    // Config for precipitation forecast
    {
      mark: "line",
      data: { values: $.forecastData },
      encoding: {
        y: {
          field: "precipitation",
          type: "quantitative",
        },
        x: {
          field: "hour",
        },
      },
    },
    // Config for displaying current time
    {
      data: { values: [{ hour: new Date().getHours() }] },
      mark: { type: "rule", strokeDash: [2, 2], size: 2, color: "red" },
      encoding: {
        x: { field: "hour" },
      },
    },
  ],
};

export default <VegaLite spec={spec} />;
```

Very nice, we managed to create a first chart using real api data!  
But what if we would like to know the forecast of another city? If we update the exported latitude and longitude variables we automatically trigger the previous api call and therefor also rerender the chart.

Try it out!  
<small>(Click the arrow on the side of the chart below to show the code of the dropdown)</small>

```typescript
// @default-collapsed
export let select = typecell.Input(
  <select>
    <option value="Amsterdam">Amsterdam</option>
    <option value="London">London</option>
    <option value="Istanbul">Istanbul</option>
  </select>,
  "Amsterdam"
);

export default (
  <div>
    <b>Select other city</b> <br></br>
    {select}
  </div>
);
```

```typescript
switch ($.select[0]) {
  case "Amsterdam":
    $.lat = 52.3738;
    $.long = 4.891;
    return;
  case "London":
    $.lat = 51.509865;
    $.long = -0.118092;
    return;
  case "Istanbul":
    $.lat = 41.047867;
    $.long = 28.898272;
    return;
  default:
    return;
}
```

## Next up - Chart.js

Notice that we also have temperature data in the `$.forecastData` array. Instead of showing the rain forecast, let's try and make a bar chart with the temperature data per hour. Chart.js works a little different compared to VegaLite. Instead of providing a single data array we need to separate labels and the data values.

```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  height: 100,
};

// Get the labels by mapping the forecastData object into the hour as a string
const labels = $.forecastData.map(
  (d: { precipitation: number; hour: number }) => d.hour.toString()
);

export const data = {
  labels,
  datasets: [
    {
      label: "Temperature",
      // We do the same here for temperature
      data: $.forecastData.map(
        (d: { temperature: number; hour: number }) => d.temperature
      ),
      backgroundColor: "rgba(43, 99, 132, 0.8)",
    },
  ],
};

export default (
  <div>
    <Bar options={options} data={data} />
  </div>
);
```
