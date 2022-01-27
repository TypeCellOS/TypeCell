# It's all about timing

Our first code block will export the current time which we will update every second. This means that every
code block that uses `$.time` will automatically update every second.

```typescript
export let time = new Date();

setInterval(() => {
  $.time = new Date();
}, 1000);
```

We could pass our time variable into a React component that will show us the time in analog.

```typescript
import AnalogClock from "analog-clock-react";

export default (
  <div style={{ justifyContent: "center", display: "flex" }}>
    <AnalogClock
      useCustomTime={true}
      width={"150px"}
      seconds={$.time.getSeconds()}
      minutes={$.time.getMinutes()}
      hours={$.time.getHours()}
    />
  </div>
);
```

## Working with time differences

Now that we have the current time it could be interesting to compare it to future dates and see how many seconds/minutes/days are needed until the event.
We can create a simple function that will return this data based on the difference between two given dates.

```typescript
export function timeDiff(date1: Date, date2: Date) {
  const timeLeft = date1.getTime() - date2.getTime();
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  return {
    days: Math.floor(timeLeft / day),
    hours: Math.floor((timeLeft % day) / hour),
    minutes: Math.floor((timeLeft % hour) / minute),
    seconds: Math.floor((timeLeft % minute) / second),
  };
}
```

Let's use the `timeDiff()` function to figure out how long it will take until the next year.

```typescript
const currentYear = $.time.getFullYear();
const newYear = new Date(`Jan 1, ${currentYear + 1} 00:00:00`);

const { days, hours, minutes, seconds } = $.timeDiff(newYear, $.time);

export default (
  <p>
    Time till new year:{" "}
    <b>
      {days} days, {hours} hours, {minutes} minutes, {seconds} seconds{" "}
    </b>
  </p>
);
```

We can also calculate how long you've been on this page based on when the codeblock below is rendered and the `$.time` variable.
The exported variable `timeOnPageOpen` will only update if the page is refreshed or if you make changes to the block below.

```typescript
export const timeOnPageOpen = new Date();
```

Notice that it's important to keep `timeOnPageOpen` in a separate code block from `$.time` because that causes the block to reload.

```typescript
const diff = $.timeDiff($.time, $.timeOnPageOpen);

export default (
  <p>
    Time spend on this page:{" "}
    <b>
      {diff.minutes} minutes, {diff.seconds} seconds
    </b>
  </p>
);
```

### Figuring out the time till the next holiday

Suppose we want to know when the next holiday is. We can get a list of holidays for a country from <a href="https://date.nager.at/" about="_blank">date.nager</a> and check how much time it will take.

First we can create an input for selecting a country.

```typescript
export let countryCode = typecell.Input(
  <select>
    <option value="GB">United Kingdom</option>
    <option value="NL">Netherlands</option>
    <option value="DE">Germany</option>
  </select>,
  "GB"
);
```

Next, we make an API call to fetch all holidays for the selected country. We can filter and sort the returned holidays
to make sure that it's in the future and in the right order.

```typescript
const currentYear = new Date().getFullYear();

const response = await fetch(
  `https://date.nager.at/api/v3/publicholidays/${currentYear}/${$.countryCode}`
);
const result = await response.json();

export const holidays = result
  .filter(
    (holiday: { date: string }) => new Date(holiday.date).getTime() > Date.now()
  )
  .sort((a: { date: string }, b: { date: string }) => {
    if (new Date(a.date).getTime() > new Date(b.date).getTime()) {
      return 1;
    } else if (new Date(a.date).getTime() < new Date(b.date).getTime()) {
      return -1;
    } else {
      return 0;
    }
  });
```

Compare the date of the first upcoming holiday with the current time using the `$.timeDiff` function.

```typescript
const time = $.time;
const upcomingHoliday = (await $.holidays)[0];
const upcomingHolidayHolidayDate = new Date(upcomingHoliday.date);

export const { days, hours, minutes, seconds } = $.timeDiff(
  upcomingHolidayHolidayDate,
  time
);

export default (
  <p>
    Days till next holiday:{" "}
    <b>
      {days} days, {minutes} minutes, {seconds} seconds
    </b>{" "}
    ({upcomingHoliday.name})
  </p>
);
```
