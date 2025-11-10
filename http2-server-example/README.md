# HTTP/2 Server Example

Demonstrates HTTP/2 capabilities with MoroJS, including server push, stream priorities, and advanced HTTP/2 features.

## Features

- HTTP/2 server with HTTP/1.1 fallback
- Automatic server push for CSS/JS resources
- Manual server push examples
- Stream prioritization
- Header compression (HPACK)
- Stream multiplexing
- Priority-based resource delivery

## Prerequisites

HTTP/2 requires SSL/TLS certificates. For local development, you can use self-signed certificates.

### Generate Self-Signed Certificates

```bash
cd http2-server-example
openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -days 365
```

This generates two files in the example directory:

- `localhost-key.pem` - Private key
- `localhost-cert.pem` - Certificate

## Usage

### For Moro Framework Development

When working in the MoroJS monorepo (has `../../MoroJS` directory):

```bash
npm install  # Uses local MoroJS source automatically
npm run dev  # Real-time TypeScript development
```

### For External Developers

When using this example standalone:

```bash
npm run switch:npm  # Installs moro from npm
npm run dev         # Runs with published package
```

## Browser Warning

When you visit `https://localhost:3000`, your browser will show a security warning because the certificate is self-signed. This is expected for development.

### Chrome

1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

### Firefox

1. Click "Advanced"
2. Click "Accept the Risk and Continue"

## API Endpoints

| Method | Endpoint           | Description                          |
| ------ | ------------------ | ------------------------------------ |
| `GET`  | `/`                | Home page with automatic server push |
| `GET`  | `/push-demo`       | Manual server push demonstration     |
| `GET`  | `/api/data`        | API endpoint with high priority      |
| `GET`  | `/priority-test`   | Critical priority response           |
| `GET`  | `/background-data` | Low priority background data         |
| `GET`  | `/styles/:file`    | CSS files with caching               |
| `GET`  | `/scripts/:file`   | JavaScript files with caching        |

## Testing

```bash
# Test home page (with server push)
curl -k https://localhost:3000/

# Test API endpoint
curl -k https://localhost:3000/api/data

# Test priority
curl -k https://localhost:3000/priority-test
```

## Concepts Demonstrated

- **Server Push**: Automatically push CSS/JS resources before the browser requests them
- **Stream Prioritization**: Control resource delivery priority
- **Header Compression**: HPACK compression for efficient header transmission
- **Multiplexing**: Multiple requests over a single connection
- **HTTP/1.1 Fallback**: Graceful degradation for older clients

## Production Certificates

For production, use certificates from a trusted Certificate Authority:

### Let's Encrypt (Free)

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

Then update the certificate paths in `src/server.ts`.

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
