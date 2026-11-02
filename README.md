# DNS Server Project

## Resource List  
https://engineerhead.github.io/dns-server/  
https://nodejs.org/api/dgram.html  
https://nodejs.org/api/buffer.html#buffer  

## Domain Response Breakdown: Example

07 6578616d706c65 03 636f6d 00   Domain name

'07' signifies the length of the domain label, '03' separates and gives the next label length and '00' ends the domain name line.

7070 8400 0001 0001 0000 0000                        Header  
07 6578616d706c65 03 636f6d 00 0001 0001             Question  
c00c 0001 0001 0000003c 0004 01020304                Answer  

## Inputs  
dig @127.0.0.1 -p 8053 example.com AAAA  
dig @127.0.0.1 -p 8053 example.com  