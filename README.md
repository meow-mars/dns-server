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

## Readings  
https://www.cloudflare.com/learning/dns/dns-records/dns-soa-record/  
https://www.geeksforgeeks.org/linux-unix/dig-command-in-linux-with-examples/  
https://medium.com/@sharma.sarthak222872/build-your-own-dns-server-in-node-js-from-scratch-264b328b6d00  

## Header Structure [Adapted from @sharma.sarthak222872]  
Bytes  
0–1 → ID  
2–3 → FLAGS  
4–5 → QDCOUNT  
6–7 → ANCOUNT  
8–9 → NSCOUNT  
10–11 → ARCOUNT  

