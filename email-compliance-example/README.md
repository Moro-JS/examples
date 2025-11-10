# Email Compliance Example

Demonstrates email compliance features with MoroJS, including RFC 2369 list management headers, threading, delivery status notifications, and custom headers.

## Features

- RFC 2369 list management headers (List-Unsubscribe, List-Id, etc.)
- Email threading (In-Reply-To, References)
- Delivery Status Notifications (DSN)
- Scheduled emails
- Custom headers
- Proper sender information
- Message identification
- Tracking and categorization

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

| Method | Endpoint           | Description                                   |
| ------ | ------------------ | --------------------------------------------- |
| `POST` | `/send-newsletter` | Newsletter with compliance headers (RFC 2369) |
| `POST` | `/send-reply`      | Transactional email with threading            |
| `POST` | `/send-scheduled`  | Scheduled email with DSN                      |
| `POST` | `/send-marketing`  | Marketing email with full compliance          |
| `POST` | `/send-invoice`    | Transactional email with custom headers       |

## Testing

```bash
# Send newsletter with compliance headers
curl -X POST http://localhost:3000/send-newsletter

# Send reply with threading
curl -X POST http://localhost:3000/send-reply

# Send scheduled email
curl -X POST http://localhost:3000/send-scheduled

# Send marketing email
curl -X POST http://localhost:3000/send-marketing

# Send invoice with custom headers
curl -X POST http://localhost:3000/send-invoice
```

## Compliance Features

### RFC 2369 List Management Headers

Required for bulk email compliance:

- `List-Unsubscribe`: Unsubscribe URL and email
- `List-Unsubscribe-Post`: One-click unsubscribe support
- `List-Id`: Unique identifier for the mailing list
- `List-Help`: Help URL
- `List-Subscribe`: Subscribe URL
- `List-Archive`: Archive URL

### Email Threading

For conversation continuity:

- `In-Reply-To`: Original message ID
- `References`: Chain of message IDs
- `Message-ID`: Unique message identifier

### Delivery Status Notifications (DSN)

Track email delivery:

- `notify`: When to send DSN (success, failure, delay, never)
- `returnFull`: Return full message body
- `returnHeaders`: Return message headers

### Custom Headers

Add any custom headers for tracking, categorization, or application-specific needs.

## Concepts Demonstrated

- **Email Compliance**: RFC 2369 list management headers
- **Threading**: Email conversation continuity
- **DSN**: Delivery status notifications
- **Scheduling**: Scheduled email delivery
- **Custom Headers**: Application-specific headers
- **Sender Information**: Proper from/reply-to/return-path configuration
- **Tracking**: Tags and metadata for categorization

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
