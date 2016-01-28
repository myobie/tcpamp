require 'socket'
require 'securerandom'

amount = (ARGV[0] || "32").to_i

s = TCPSocket.new 'localhost', 2000
s.puts SecureRandom.random_bytes(amount)

while line = s.gets
  puts line
end

s.close
