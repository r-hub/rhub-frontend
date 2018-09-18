# About the R-hub builder

The R-hub builder offers free R CMD Check as a service on different platforms. It is a project by Gábor Csárdi, supported by the R Consortium.

## Why use R-hub builder? 

The builder allows you to check your R package on several platforms, and R versions.

Moreover, as a side-effect it also allows you to _build_ your R package on several platforms, and R versions.

## How to use R-hub builder?

You can use the R-hub builder either

* via the website (where you are now!)

* via its API, in particular by using the [`rhub` package](https://github.com/r-hub/rhub).

You can see a live demo of both the website frontend and of the `rhub` R package by Gábor Csárdi in [this video](https://www.r-consortium.org/events/2016/10/11/r-hub-public-beta).

Advantages of using the `rhub` package over the website are that it allows your not living R, and that the R package offers shortcut functions such as `rhub::check_for_cran`, as well as the listing of your recent and current builds, by email address or package.

## A bug, question or feature request?

Your contributions are welcome. R-hub is developed entirely in the open [in its own GitHub organization](https://github.com/r-hub):

* If you can identify to which repo your bug report/feature request/question belongs file an issue there. E.g. the source for this website lives [here](https://github.com/r-hub/rhub-frontend).

* If you can't find to which repo your bug report/feature request/question belongs, no problem, file an issue in [the repo of the R package](https://github.com/r-hub/rhub). 

You can also send an email to admin@r-hub.io, and there might soon be a mailing list, stay tuned. You could also ask usage questions over [at RStudio community forum](https://community.rstudio.com/).