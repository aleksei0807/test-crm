FROM golang:alpine

RUN apk add --update -t build-deps curl go git libc-dev gcc libgcc

COPY ./server/cmd/test-crm/* /go/src/app/
RUN cd /go/src/app && go get -d -v && go install -v

COPY ./dist /go/src/app/dist

WORKDIR /go/src/app

RUN ls -alF /go/src/app; ls -alF /go/src/app/dist

CMD ["app", "--host", "0.0.0.0", "--port", "80"]
