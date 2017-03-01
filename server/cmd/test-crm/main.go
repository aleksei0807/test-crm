package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/buaazp/fasthttprouter"
	"github.com/kirillDanshin/myutils"
	"github.com/valyala/fasthttp"
)

const (
	static = "/static"
	all    = "/*route"
	index  = "/index.html"
	route  = "route"
	ise    = "Internal server error"
)

var (
	dir      = flag.String("dir", "./dist", "directory to serve")
	conf     = flag.String("conf", "./config.json", "path to json config file")
	hostFlag = flag.String("host", "0.0.0.0", "host to listen on")
	portFlag = flag.String("port", "64128", "host to listen on")
)

func handler(ctx *fasthttp.RequestCtx) {
	myRoute := ctx.UserValue(route)
	if myRoute == nil {
		ctx.Error(ise, 500)
		return
	}
	localRoute := myRoute.(string)
	if strings.HasPrefix(localRoute, static) {
		fasthttp.ServeFile(ctx, myutils.Concat(*dir, localRoute))
		return
	}
	fasthttp.ServeFile(ctx, myutils.Concat(*dir, index))
}

func readInConfig() *Config {
	var c Config
	confFile, err := os.Open(*conf)
	if err == nil {
		confReader := bufio.NewReader(confFile)

		dec := json.NewDecoder(confReader)
		if err := dec.Decode(&c); err != nil && err != io.EOF {
			log.Fatal(err)
		}
		confFile.Close()
	} else {
		if *hostFlag != "" {
			c.Host = *hostFlag
		}
		if *portFlag != "" {
			c.Port, err = strconv.Atoi(*portFlag)
			myutils.LogFatalError(err)
		}
	}

	return &c
}

func main() {
	flag.Parse()
	c := readInConfig()
	host := c.Host
	if host == "" {
		host = "0.0.0.0"
	}
	if c.Port == 0 {
		c.Port = 80
	}
	addr := fmt.Sprintf("%s:%v", host, c.Port)

	r := fasthttprouter.New()
	r.GET(all, handler)

	log.Printf("Serving %s on %s\n", *dir, addr)
	myutils.LogFatalError(fasthttp.ListenAndServe(addr, r.Handler))
}
