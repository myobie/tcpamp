require 'socket'
require 'securerandom'
$stdout.sync = true

READ_CHUNK = 1_024 * 4
MAX_BYTES = 1_000 * 1_024 * 1_024
PORTS = [[2000, 2001], [2001, 2002], [2002, 2000]]

$servers = {}

def send_to_server(port, bytes)
  server = $servers[port]
  if server.nil?
    p [:error, "a server is not ready", $servers]
    return # don't do anything yet, server isn't booted
  else
    client = TCPSocket.new('127.0.0.1', port)
    client.puts bytes
    client.close
    true
  end
end

def make_server(port, other_port)
  if $servers[port].nil?
    server = $servers[port] = TCPServer.new port

    Thread.new(server) do |server|
      loop do
        begin
          Thread.new(server.accept) do |client|
            input = client.read
            puts "Received #{input.length} bytes\n"

            length = if input.length < MAX_BYTES then input.length * 2 else MAX_BYTES end
            output = SecureRandom.random_bytes(length)

            if send_to_server(other_port, output)
              puts "Sent #{output.length} bytes to #{other_port}\n"
              sleep 0.1
            else
              puts "Can't send to #{other_port} yet\n"
            end

            client.close
          end
        rescue Exception => e
          p [:exception, e]
        end
      end
      puts "Server stopped looping?!"
    end
  end
end

threads = PORTS.map { |(mine, other)| make_server mine, other }

puts "Starting in...\n"
5.downto(0) do |num|
  if num == 0
    send_to_server 2000, SecureRandom.random_bytes
  else
    puts "#{num}\n" and sleep 1
  end
end

begin
  threads.map(&:join)
rescue Interrupt
  threads.map(&:exit)
end

puts "Done"
