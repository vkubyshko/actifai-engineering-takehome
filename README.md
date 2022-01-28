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
to our users. 

Your job is to:
1. Decide what data would be important for this dashboard
2. Build out an API to deliver the data to the front-end

## Codebase

This repository contains a bare-bones Node/Express server, which is defined in `server.js`. This file is where you will
define your endpoints.

## Getting started

1. Install Docker (if you don't already have it)
2. From the root of this repo, run `docker-compose build` to compile the images and install requirements.
3. In one terminal window, run `docker-compose up db`. When the database is ready, you should see a log similar to
"database system is ready to accept connections"
4. Once the database is up, in another window, run `docker-compose up api`
5. You now have a server running on your machine. You can test it by navigating to `http://localhost:3000/health` in
your browser. You should see a "Hello World" message.


## Help

If you have any questions, feel free to reach out to your interview scheduler for clarification!
