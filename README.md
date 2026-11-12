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

## Field Count: Resource Record processing [Adapted from 5.1 Format - RFC 1035]

### Record format
RFC 1035 allows a resource record to be written in either of these forms:

```text
[<TTL>] [<class>] <type> <RDATA>
[<class>] [<TTL>] <type> <RDATA>
```

Items in square brackets are optional:

| Part | Required? | Example |
|---|---|---|
| Name | Optional | `www`, `@` |
| TTL | Optional | `300` |
| Class | Optional | `IN` |
| Type | Required | `A`, `MX` |
| Data | Required | `192.0.2.3` |

### Approach: find the type first
The guide this project is based on works out which parts a line includes by counting its items. That breaks when the TTL and class swap places, when the class is left out, and for MX records, whose priority looks just like a TTL.

Instead, this parser finds the record's type first and splits the line around it:

```text
mail   300   IN   MX   10   mail.example.com.
└──── before ────┘type └────── after ───────┘
```

- **Before the type:** The name, TTL and class, in any order.
- **After the type:** The data.

This works because, as RFC 1035 puts it, "type and class mnemonics are disjoint, the parse is unique". No word is both a type and a class, so each item can be identified by what it looks like:

| Item looks like | It's treated as |
|---|---|
| A whole number | TTL |
| `IN` | Class |
| Anything else | Name |

### Filling in missing parts
| Part | If it's missing |
|---|---|
| Name | Copied from the last stated name. A line starting with a blank "is assumed to be owned by the last stated owner" (RFC 1035) |
| TTL | Taken from `$TTL`, which applies to every record without its own TTL. Without `$TTL`, the last stated TTL is used |
| Class | RFC 1035 uses the last stated class. This server only supports `IN`, so a missing class is treated as `IN` |

### Reading the data
| Type | Data |
|---|---|
| `A` | One IPv4 address |
| `NS` | One name server |
| `CNAME` | One domain name |
| `MX` | A priority, then the mail server |

A line with the wrong number of items is skipped and a warning is printed.