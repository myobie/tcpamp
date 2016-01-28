package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"gopkg.in/redis.v3"
	"io"
	"log"
	"net"
)

var remoteAddr *string = flag.String("r", "nathanherald.com:80", "remote address")

func proxy(rAddr *net.TCPAddr, c net.Conn) *bytes.Buffer {
	defer c.Close()
	log.Println("proxying")

	var b bytes.Buffer

	rConn, err := net.DialTCP("tcp", nil, rAddr)
	if err != nil {
		log.Fatal(err)
	}
	defer rConn.Close()

	go func() {
		for {
			data := make([]byte, 64)
			n, err := c.Read(data)

			if err != nil {
				if err != io.EOF {
					log.Fatal(err)
				}
				break
			}

			fmt.Print(".")
			b.Write(data[:n])
			rConn.Write(data[:n])
		}
	}()

	var rb bytes.Buffer

	for {
		data := make([]byte, 256)
		n, err := rConn.Read(data)

		if err != nil {
			if err != io.EOF {
				log.Fatal(err)
			}
			break
		}

		fmt.Print(".")
		rb.Write(data[:n])
		c.Write(data[:n])
	}

	_, err = io.Copy(&b, &rb)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Print("\n")

	return &b
}

func formatBytes(buffer *bytes.Buffer) string {
	var numbers []int

	for _, b := range buffer.Bytes() {
		number := b - 32

		if number < 0 {
			number = 0
		}
		if number > 94 {
			number = 94
		}

		perc := float64(number) / 94.0
		note := int((perc * 16.0) + 42.0)

		// fmt.Printf("byte %v, perc %v, note %v\n", b, perc, note)

		numbers = append(numbers, note)
	}

	result, err := json.Marshal(numbers)

	if err != nil {
		log.Print("There was something wrong with making the json from the byte ints")
		return ""
	}

	s := string(result)

	// fmt.Printf("result '%s'", s)

	return s
}

func enqueue(client *redis.Client, s string) error {
	log.Print("**** about to send to redis")

	err := client.Publish("notes", s).Err()

	if err != nil {
		log.Printf("redis error: %v", err)
	}

	return err
}

func handleConns(client *redis.Client, rAddr *net.TCPAddr, in <-chan net.Conn) {
	for c := range in {
		b := proxy(rAddr, c)
		s := formatBytes(b)
		enqueue(client, s)
	}
}

func main() {
	flag.Parse()

	rAddr, err := net.ResolveTCPAddr("tcp", *remoteAddr)
	if err != nil {
		log.Fatal(err)
	}

	listener, err := net.Listen("tcp", ":9999")
	if err != nil {
		log.Fatal(err)
	}

	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	log.Printf("Listening: 9999\nProxying: %v\n\n", rAddr)

	conns := make(chan net.Conn)

	go handleConns(client, rAddr, conns)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Fatal(err)
		}
		conns <- conn
	}
}
