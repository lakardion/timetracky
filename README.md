# Summary

Project to track work hours

# Motivation

Get some practice with t3 stack.

Attempt to have a take on an everyday problem for human resource management in companies

# Using

- NextJS
- tRPC as api layer
- Prisma as ORM with PostgreSQL behind
- Google SSO with Next-auth
- Tailwind CSS

# Current features

- SSO with Google
- Hours
  - Add hour
  - See recently added hours
  - See hours in calendar as events
  - Select range in calendar and see hour details within that range
  - Infinitely scroll on recently added hours
  - Edit hours
  - Delete hours
- Projects
  - Create delete edit projects
  - Display current total hours registered for project
- Administration
  - Administration breadcrumb navigation
  - Clients
    - Create delete edit clients
    - Display total projects the client has
  - Tags
    - Create delete tags.
    - Display total hours each tag has been assigned to
  - Users
    - Display users with masked email
    - Display summary of hours and projects
    - Display profile picture (from google)
    - Allow edit role of user

# Dev setup

## Prerequisites

You need to have a `postgresql` database created so that you can add its connection url in the `.env` file.

A local connection url for postgres looks like this

`postgres://<username>:<password>@localhost/<databasename>`

## Add envionment file

Copy the existing `.env-example` and rename it to `.env`. Fill the placeholder values with your own

## Install packages

```shell
yarn
```

## Run project

```shell
yarn dev
```

## Tests

You can run tests with playwright, but you need to have a test google account and add the credentials to the `.env` file (you can add your own, the .env file does not get committed).

We have the test account credentials as github secrets, so it runs on github actions safely

While in development:

```shell
yarn run test-dev
```

# Create T3 App

This is an app bootstrapped according to the [init.tips](https://init.tips) stack, also known as the T3-Stack.
