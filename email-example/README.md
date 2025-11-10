# Email Example

Demonstrates the email functionality of MoroJS, including sending simple emails, HTML emails, templates, attachments, and bulk emails.

## Features

- Simple text emails
- HTML emails
- Email templates
- Email attachments
- Bulk email sending
- Multiple adapter support (Console, Nodemailer, SendGrid, AWS SES, Resend)
- Queue integration

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

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| `POST` | `/send-simple`          | Send a simple text email                |
| `POST` | `/send-html`            | Send an HTML email                      |
| `POST` | `/send-template`        | Send email using a template             |
| `POST` | `/send-with-attachment` | Send email with attachment              |
| `POST` | `/send-bulk`            | Send bulk emails to multiple recipients |

## Testing

```bash
# Send simple email
curl -X POST http://localhost:3000/send-simple

# Send HTML email
curl -X POST http://localhost:3000/send-html

# Send email with template
curl -X POST http://localhost:3000/send-template

# Send email with attachment
curl -X POST http://localhost:3000/send-with-attachment

# Send bulk emails
curl -X POST http://localhost:3000/send-bulk
```

## Email Adapters

The example uses the `console` adapter by default, which logs emails to the console. To use a real email service, uncomment and configure one of the adapters in `src/server.ts`:

- **Nodemailer**: SMTP-based email sending
- **SendGrid**: SendGrid API integration
- **AWS SES**: Amazon Simple Email Service
- **Resend**: Resend API integration

### Example: Using Nodemailer (SMTP)

```typescript
await app.mailInit({
  adapter: 'nodemailer',
  from: 'noreply@myapp.com',
  connection: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
});
```

## Concepts Demonstrated

- **Email Sending**: Basic email functionality
- **HTML Emails**: Rich HTML content
- **Templates**: Reusable email templates
- **Attachments**: File attachments
- **Bulk Sending**: Sending to multiple recipients
- **Adapter Pattern**: Multiple email service providers

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
