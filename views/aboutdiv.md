<!---
library("magrittr")
readLines("views/aboutdiv.md") %>%
  commonmark::markdown_html() %>%
  writeLines("views/aboutdiv.hjs")
--->
# About the R-hub builder

The R-hub builder offers free R CMD Check as a service on different platforms. It is a project supported by the R Consortium.

## Why use the R-hub builder? 

The builder allows you to check your R package on several platforms, and R versions.

Moreover, as a side-effect it also allows you to _build_ your R package, i.e. its binaries and the binaries for all (source) dependencies, on several platforms, and R versions.

## How to use the R-hub builder?

You can use the R-hub builder either

* via the website (where you are now!), from the [main page](https://builder.r-hub.io/) or [the advanced page](https://builder.r-hub.io/advanced).

* via its API, in particular by using the [`rhub` package](https://github.com/r-hub/rhub).

You can see a live demo of both the website frontend and of the `rhub` R package in [this video](https://www.r-consortium.org/events/2016/10/11/r-hub-public-beta).

Please note that you can only verify your email address from GitHub if the address associated to your GitHub account listed as maintainer address in the DESCRIPTION of the package.

### Website or package interface to the R-hub builder?

Advantages of using the `rhub` package over the website are that it allows your not leaving R, and that the R package offers shortcut functions such as `rhub::check_for_cran()`, as well as the listing of your recent and current builds, by email address or package.

## A bug, question or feature request?

Your contributions are welcome. R-hub is developed entirely in the open [in its own GitHub organization](https://github.com/r-hub).

You can post your bug report/feature request/question belongs file as an issue in [the repo of the R package](https://github.com/r-hub/rhub). 

You can also send an email to admin@r-hub.io.