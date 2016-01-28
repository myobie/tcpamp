require "net/http"
require "uri"

uri = URI(ARGV[0])
p uri

begin
  puts "Booting..."

  go_command = "go run tcp-proxy.go -r #{uri.host}:80"
  go_pid = spawn(ENV, go_command)

  node_command = "node midi-server.js"
  node_pid = spawn(ENV, node_command)

  puts "Sleeping a bit to let things settle..."
  sleep 5

  request = Net::HTTP::Get.new uri
  request["Host"] = uri.host
  response = Net::HTTP.start("127.0.0.1", 9999) { |http| http.request request }

  puts "Request has been made"
  puts "Waiting for the node server to finish playing"

  puts "*"*80
  puts response.body.to_s
  puts "*"*80

  Process.wait node_pid

  puts "Done playing, killing the go server"
rescue Interrupt
  puts "Shutting down..."
end

begin
  Process.kill "TERM", go_pid
  Process.wait go_pid
  Process.wait
rescue
end

puts "Done"
