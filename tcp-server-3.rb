require 'unimidi'
require 'socket'
require 'securerandom'
$stdout.sync = true

MAX_BYTES = 1_000 * 1_024 * 1_024
MIN_BYTES = 1_024
PORTS = [[2000, 2001], [2001, 2002], [2002, 2000]]

$servers = {}

$multiplier = 1.1

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

            length = if input.length < MAX_BYTES then input.length * $multiplier else MAX_BYTES end
            length = MIN_BYTES if length < MIN_BYTES

            output = SecureRandom.random_bytes(length.to_i)

            if send_to_server(other_port, output)
              puts "Sent #{output.length} bytes to #{other_port}\n"
              sleep 0.2
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

thread = Thread.new do
  input = UniMIDI::Input.first

  loop do
    begin
      message = input.gets.first
      # amount is between 0 and 127
      code, knob, amount = message[:data]

      puts "Knob #{knob}: #{amount}\n"

      if code == 176 && knob == 5
        $multiplier = ((amount.to_f / 127.0) * 2.0) + 0.1
      end
    rescue Exception => e
      p [:exception, e]
    end
  end
end

threads = PORTS.map { |(mine, other)| make_server mine, other }

threads.concat([thread])

puts "Starting in...\n"
5.downto(0) do |num|
  if num == 0
    send_to_server 2000, SecureRandom.random_bytes(MIN_BYTES)
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
