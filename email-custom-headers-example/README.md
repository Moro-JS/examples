# Email Custom Headers Example

Demonstrates the flexibility of custom email headers with MoroJS, showing various use cases for application-specific headers.

## Features

- Standard X-headers
- Application tracking headers
- Marketing campaign headers
- Transactional headers
- Security and compliance headers
- Multi-tenant headers
- A/B testing headers
- API integration headers

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

## API Endpoints

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| `POST` | `/send-with-standard-headers` | Standard X-headers example      |
| `POST` | `/send-with-tracking`         | Application tracking headers    |
| `POST` | `/send-campaign`              | Marketing campaign headers      |
| `POST` | `/send-transactional`         | Transactional headers           |
| `POST` | `/send-secure`                | Security and compliance headers |
| `POST` | `/send-multitenant`           | Multi-tenant headers            |
| `POST` | `/send-ab-test`               | A/B testing headers             |
| `POST` | `/send-api-triggered`         | API integration headers         |

## Testing

```bash
# Send with standard headers
curl -X POST http://localhost:3000/send-with-standard-headers

# Send with tracking
curl -X POST http://localhost:3000/send-with-tracking

# Send campaign
curl -X POST http://localhost:3000/send-campaign

# Send transactional
curl -X POST http://localhost:3000/send-transactional

# Send secure
curl -X POST http://localhost:3000/send-secure

# Send multitenant
curl -X POST http://localhost:3000/send-multitenant

# Send A/B test
curl -X POST http://localhost:3000/send-ab-test

# Send API triggered
curl -X POST http://localhost:3000/send-api-triggered
```

## Header Use Cases

### Standard X-Headers

Common email client headers:

- `X-Mailer`: Email client identifier
- `X-Priority`: Message priority (1=Highest, 3=Normal, 5=Lowest)
- `X-MSMail-Priority`: Microsoft Mail priority
- `X-Originating-IP`: Source IP address

### Application Tracking

Track requests and users:

- `X-Request-ID`: Request correlation
- `X-Correlation-ID`: Cross-service correlation
- `X-User-ID`: User identification
- `X-Session-ID`: Session tracking
- `X-App-Version`: Application version
- `X-Environment`: Environment (production, staging, etc.)
- `X-Region`: Geographic region

### Marketing Campaigns

Campaign and analytics tracking:

- `X-Campaign-ID`: Campaign identifier
- `X-Campaign-Name`: Campaign name
- `X-Campaign-Type`: Campaign type
- `X-UTM-Source`: UTM source parameter
- `X-UTM-Medium`: UTM medium parameter
- `X-UTM-Campaign`: UTM campaign parameter
- `X-Segment`: User segment
- `X-Customer-Tier`: Customer tier

### Transactional

Transaction and order tracking:

- `X-Transaction-ID`: Transaction identifier
- `X-Order-ID`: Order identifier
- `X-Payment-ID`: Payment identifier
- `X-Service`: Service name
- `X-Message-Type`: Message type
- `X-Auto-Generated`: Auto-generated flag

### Security and Compliance

Security classification and compliance:

- `X-Classification`: Security classification
- `X-Sensitivity`: Sensitivity level
- `X-Content-Type-Options`: Content type options
- `X-Frame-Options`: Frame options
- `X-Compliance-Category`: Compliance category
- `X-Data-Retention`: Data retention period
- `X-Encryption-Method`: Encryption method
- `X-Audit-ID`: Audit trail identifier

### Multi-Tenant

Tenant and organization tracking:

- `X-Tenant-ID`: Tenant identifier
- `X-Organization-ID`: Organization identifier
- `X-Workspace-ID`: Workspace identifier
- `X-Resource-Type`: Resource type
- `X-Resource-ID`: Resource identifier
- `X-Billable`: Billable flag
- `X-Cost-Center`: Cost center

### A/B Testing

Experiment tracking:

- `X-AB-Test-ID`: A/B test identifier
- `X-AB-Variant`: Variant (A, B, etc.)
- `X-AB-Test-Name`: Test name
- `X-Experiment-Group`: Experiment group
- `X-Experiment-Start`: Experiment start date
- `X-Experiment-End`: Experiment end date

### API Integration

API request tracking:

- `X-API-Key-ID`: API key identifier
- `X-API-Version`: API version
- `X-API-Endpoint`: API endpoint
- `X-Rate-Limit`: Rate limit
- `X-Rate-Limit-Remaining`: Remaining requests
- `X-Rate-Limit-Reset`: Rate limit reset time
- `X-Client-IP`: Client IP address
- `X-User-Agent`: User agent
- `X-Forwarded-For`: Forwarded IP addresses

## Concepts Demonstrated

- **Custom Headers**: Add any custom headers for your application needs
- **Tracking**: Request, user, and session tracking
- **Analytics**: Campaign and UTM parameter tracking
- **Security**: Security classification and compliance
- **Multi-Tenancy**: Tenant and organization identification
- **A/B Testing**: Experiment variant tracking
- **API Integration**: API request context tracking

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
