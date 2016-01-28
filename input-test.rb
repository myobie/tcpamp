require "unimidi"

input = UniMIDI::Input.gets

puts "Do something..."

begin
  loop do
    m = input.gets
    puts m
  end
rescue Interrupt
end

puts "Finished"
