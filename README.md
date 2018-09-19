
Source for the frontend of R-hub builder
========================================

# Notes on how to run the web app

## Requirements

You need a local Redis server. E.g. on macOS:
```
brew install redis
```

On Windows install Redis from
https://github.com/MicrosoftArchive/redis/releases

On Linux your distribution probably contains Redis.

## Install dependencies

```
npm install
npm install -g  supervisor
brew intall redis
```

`supervisor` is not strictly required, but it is nice, because it
automatically reloads the app if the source files change.

## Run the app

Start Redis, and in another terminal start the app:

```
redis-server
## In another terminal
supervisor bin/www
```

Browse http://localhost:3000/
