# Leaflet Maps

Let's see what we can do with an interactive geographical map within TypeCell.  
For this demo we will use the <a href="https://leafletjs.com/" target="_blank">Leaflet</a> library to display our map.

According to the Leaflet documentation we first need to load the css stylesheet before we can use the map. We can import the stylesheet using a css codeblock. You can change the codeblock type in the bottom right corner.

```css
@import url("https://unpkg.com/leaflet@1.7.1/dist/leaflet.css");
```

Next we will setup a basic map using the Leaflet library with openstreetmap.  
Simply import the leaflet library and add the required configuration according to the Leaflet documentaiton.
In this case I've added the code for generating the map in an exported function in order to reuse it later.

It's necessary to provide Leaflet with a tile provider. For this demo I've used the `OpenStreetMap.Mapnik` provider.
There are plenty of tile options to choose from (Find more tile providers <a href="https://leaflet-extras.github.io/leaflet-providers/preview/" target="_blank">here</a>).

```typescript
import * as L from "leaflet";

export function generateMap() {
  const container = document.createElement("div");
  container.style.cssText = "width: 100%; height: 400px";
  const map = L.map(container).setView([48.505, 17.09], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  return { element: container, map };
}

export default generateMap().element;
```

Voila! We now have a working map that we can interact with in TypeCell.

## Add airport locations âœˆï¸

What fun is a map without markers? Let's add the biggest airports in Europe to a map.
I've found a csv file that lists the locations of all airports worldwide which we can use to find all airport locations.

Using the native `fetch` function we can download the entire csv file as a string. Next, we parse the csv file using `papaparse`. Simply import the module and use the `parse` function to parse the csv into JavaScript objects. Finally, filter the airports by continent and airport type and export it.

```typescript
import * as Papa from "papaparse";

const airportCsv = await fetch(
  "https://davidmegginson.github.io/ourairports-data/airports.csv",
).then((response) => response.text());

// Pass the row type to the parser
const { data } = Papa.parse<{
  latitude_deg: string;
  longitude_deg: string;
  continent: string;
  type: string;
}>(airportCsv, {
  header: true,
  transformHeader: (header) => header.toLowerCase().split(" ").join(""),
});

// Filter and export airports
export const airports = data.filter(
  (airport) => airport.continent === "EU" && airport.type === "large_airport",
);
```

As you can see, all the airports are exported above. You are able to inspect all exported airports by clicking on the little arrow in front of `airports` above. From now on we can use `$.airports` in other code blocks.

Let's prepare the code for a new map with the airport markers. We can use the `generateMap` function that we created before to create a new map and loop over all the airports to add a marker for each one.

```typescript
import * as L from "leaflet";

const { element, map } = $.generateMap();

for (let airport of $.airports) {
  L.marker([+airport.latitude_deg, +airport.longitude_deg]).addTo(map);
}

export default element;
```
