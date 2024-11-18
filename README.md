# Actifai Engineering Takehome

## Introduction

You are an Actifai backend engineer managing a database of our users - who are call center agents - and the sales that
the users place using our application.

The database has 4 tables:

- `users`: who are the users (name, role)
- `groups`: groups of users
- `user_groups`: which users belong to which groups
- `sales`: who made a sale, for how much, and when was it made

The front-end team has decided to build an analytics and reporting dashboard to display information about performance
to our users. They are interested in tracking which users and groups are performing well (in terms of their sales). The
primary metric they have specified as a requirement is average revenue and total revenue by user and group, for a given
month.

Your job is to build the API that will deliver data to this dashboard. In addition to the stated requirements above, we
would like to see you think about what additional data/metrics would be useful to add.

At a minimum, write one endpoint that returns time series data for user sales i.e. a list of rows, where each row
corresponds to a time window and information about sales. When you design the endpoint, think  about what query
parameters and options you want to support, to allow flexibility for the front-end team.

## Codebase

This repository contains a bare-bones Node/Express server, which is defined in `server.js`. This file is where you will
define your endpoints.

## Getting started

1. Install Docker (if you don't already have it)
2. Run `npm i` to install dependencies
3. Run `docker-compose up` to compile and run the images.
4. You now have a database and server running on your machine. You can test it by navigating to `http://localhost:3000/health` in
your browser. You should see a "Hello World" message.


## Help

If you have any questions, feel free to reach out to your interview scheduler for clarification!

## Endpoint documentation

hit the GET endpoint `localhost:3000/time-series` using the following parameters:

- `partitionByYear`: required, boolean. true returns data parsed by year
- `partitionByMonth`: required, boolean. true returns data parsed by month
- `partitionByDate`: required, boolean. true returns data parsed by day
- `partitionByDayOfWeek`: boolean. true returns data parsed by day of the week
- `startDate`: optional. the first day to include in the calculations (inclusive). defaults to no filter
- `endDate`: optional. the last day to include in the calculations (inclusive). defaults to no filter. returns no results if end date is before the start date.
- `partitionByType`: required, string, options: user, role, group, or none. What the results will be partitioned on.
- `calculation`: required, string, options: total, max, min, average, count. Can query for multiple stats at once using a comma separated list (ie 'total,average')
- `userId`: optional, int. Id of user to query
- `groupId`: optional, int. Id of group to query

example query and result:

`localhost:3000/time-series?partitionByType=group&startDate=2021-01-01&endDate=2021-01-31&partitionByYear=true&partitionByMonth=true&calculation=total, average, max, min&partitionByDay=false`

```
[
    {
        "sum": "4516888",
        "avg": "25093.822222222222",
        "max": 49728,
        "min": 1813,
        "year": "2021",
        "month": "January",
        "month_id": "1",
        "group_id": 1,
        "group_name": "Northeast Sales Team"
    },
    {
        "sum": "4783425",
        "avg": "26138.934426229508",
        "max": 49904,
        "min": 1387,
        "year": "2021",
        "month": "January",
        "month_id": "1",
        "group_id": 2,
        "group_name": "West Coast Sales Team"
    },
    {
        "sum": "3277567",
        "avg": "28750.587719298246",
        "max": 49904,
        "min": 1505,
        "year": "2021",
        "month": "January",
        "month_id": "1",
        "group_id": 3,
        "group_name": "Digital Sales Team"
    }
]
```