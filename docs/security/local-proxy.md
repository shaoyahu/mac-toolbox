# Local Proxy Privacy Model

macOS Toolbox runs a local manual proxy only when the user starts it. The proxy
binds to `127.0.0.1`, so other machines on the network cannot route through it.

## What The MVP Captures

- HTTP request method, URL, host, path, and request headers.
- Response status when an upstream HTTP response is available.
- Request duration and timestamp metadata.
- IDs of header rewrite rules that matched the request.

Traffic history is kept in bounded memory only. It is cleared when the proxy
state is cleared or the app process exits.

## What The MVP Does Not Capture

- HTTPS request bodies or decrypted HTTPS headers beyond CONNECT metadata.
- HTTP request bodies.
- Persistent traffic history.
- System-wide transparent traffic.
- Browser traffic that was not manually configured to use the local proxy.

## HTTPS CONNECT Behavior

When a client sends an HTTPS `CONNECT` request, the MVP records tunnel metadata
such as method, host, port target, timestamp, and duration. It does not establish
TLS interception, install a root certificate, decrypt payloads, or inspect HTTPS
request bodies.

## Header Rewrite Scope

Header rewrite rules apply only to requests that pass through this app's local
proxy. They do not affect system traffic, browser extension traffic, or apps
that are not explicitly configured to use the local proxy.

## Manual Browser Setup

Start the proxy from the Traffic page, then configure your browser or HTTP
client to use `127.0.0.1:<port>` as its HTTP proxy. Disable that manual proxy
setting when you are done testing.
