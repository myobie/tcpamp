require 'socket'
require 'securerandom'

server = TCPServer.new 2000
puts "Listening on 127.0.0.1:2000"

begin
  loop do
    Thread.new(server.accept) do |client|
      puts "Received connection #{client.inspect}"
      input = client.gets
      puts "Received #{input.length} bytes"
      output = SecureRandom.random_bytes(input.length * 2)
      client.puts output
      puts "Sent #{output.length} bytes"
      client.close
      puts "Connection closed #{client.inspect}"
    end
  end
rescue Interrupt
end

server.close
puts "Done"
