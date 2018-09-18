Source for the frontend of R-hub builder
========================================

# Notes on how to build the website 

## On macOS

```
npm install
npm install -g  supervisor
export JENKINS_URL=http://jenkins.r-hub.io:8080/
export  LOGDB_URL=http://172.31.30.118:5984/logs
export  GITHUB_CLIENT_ID=foo
export GITHUB_CLIENT_SECRET=bar
brew intall redis
# In another terminal:
redis-server
# In the original terminal:
supervisor bin/www
# browse http://localhost:3000/
```

## On Windows

```
# first install npm
npm install
npm install -g  supervisor
SET JENKINS_URL=http://jenkins.r-hub.io:8080/
SET LOGDB_URL=http://172.31.30.118:5984/logs
SET GITHUB_CLIENT_ID=foo
SET GITHUB_CLIENT_SECRET=bar
# install redis from https://github.com/MicrosoftArchive/redis/releases 
# In another terminal:
redis-server
# In the original terminal:
supervisor bin/www
# browse http://localhost:3000/

```


# How to create the about
```r
library("magrittr")
readLines("views/aboutdiv.md") %>%
  commonmark::markdown_html() %>%
  writeLines("views/aboutdiv.hjs")
```