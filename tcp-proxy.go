package main

import (
	"bytes"
	"flag"
	"fmt"
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

func formatBytes(buffer *bytes.Buffer) {
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

		fmt.Printf("byte %v, perc %v, note %v\n", b, perc, note)

		numbers = append(numbers, note)
	}

	fmt.Printf("numbers %v", numbers)
}

func handleConns(rAddr *net.TCPAddr, in <-chan net.Conn) {
	for c := range in {
		b := proxy(rAddr, c)
		formatBytes(b)
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

	fmt.Printf("Listening: 9999\nProxying: %v\n\n", rAddr)

	conns := make(chan net.Conn)

	go handleConns(rAddr, conns)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Fatal(err)
		}
		conns <- conn
	}
}
