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

# Current features and todos

(Will most likely move these to issues)

- Auth
  - [x] SSO with Google
  - [x] Authorization-guard for role checking
- Hours
  - [x] list hours
  - [x] create hours
  - [x] edit hours
  - [x] delete hours
  - [ ] calendar integration
    - [x] filter by date
    - [x] multiple select
    - [ ] Improve styling on mobile
  - [ ] create some sort of time awareness. When is a user out of date in hours?
    - [ ] Maybe integrate an email notification on fridays eod (if hours were not loaded for that week)
- Projects (admin/manager)
  - [x] list projects with the amount of hours that they have related
  - [x] create, edit delete projects
- Administration
  - [x] create, edit delete Clients
  - [x] create, edit delete tags
  - [ ] edit user information (roleType, workingHours)
- Reports (admin/manager)
  - [ ] base view
  - [ ] idea: show users with their corresponding most recent hours. Show indicator if user has not logged any hours during this week, or has loaded less than expected (workingHours field of user)
  - [ ] ... More to come

# Create T3 App

This is an app bootstrapped according to the [init.tips](https://init.tips) stack, also known as the T3-Stack.
