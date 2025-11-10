// MoroJS Email System Example
// Demonstrates the full email functionality

import { createApp } from '@morojs/moro';

const app = createApp();

// Configure email system with console adapter (for development)
app.mailInit({
  adapter: 'console',
  from: {
    name: 'My App',
    email: 'noreply@myapp.com',
  },
  templates: {
    path: './emails',
    engine: 'moro',
    cache: true,
  },
});

// Example 1: Simple text email
app.post('/send-simple').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Welcome to My App',
    text: 'Thank you for signing up!',
  });

  return { success: result.success, messageId: result.messageId };
});

// Example 2: HTML email
app.post('/send-html').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Welcome to My App',
    html: '<h1>Welcome!</h1><p>Thank you for signing up!</p>',
    text: 'Thank you for signing up!',
  });

  return { success: result.success };
});

// Example 3: Email with template
app.post('/send-template').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Password Reset',
    template: 'password-reset',
    data: {
      name: 'John Doe',
      resetUrl: 'https://myapp.com/reset/token123',
      expiresIn: '1 hour',
    },
  });

  return { success: result.success };
});

// Example 4: Email with attachments
app.post('/send-with-attachment').handler(async (req, res) => {
  const pdfBuffer = Buffer.from('PDF content here');

  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Your Invoice',
    text: 'Please find your invoice attached.',
    attachments: [
      {
        filename: 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return { success: result.success };
});

// Example 5: Bulk emails
app.post('/send-bulk').handler(async (req, res) => {
  const users = [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ];

  const results = await app.sendBulkMail(
    users.map(user => ({
      to: user.email,
      subject: 'Newsletter',
      text: `Hi ${user.name}, here is our latest newsletter!`,
    }))
  );

  return {
    total: results.length,
    successful: results.filter(r => r.success).length,
  };
});

// Example 6: Using Nodemailer adapter (SMTP)
/*
app.mailInit({
  adapter: 'nodemailer',
  from: 'noreply@myapp.com',
  connection: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }
});
*/

// Example 7: Using SendGrid adapter
/*
app.mailInit({
  adapter: 'sendgrid',
  from: 'noreply@myapp.com',
  connection: {
    apiKey: process.env.SENDGRID_API_KEY
  }
});
*/

// Example 8: Using AWS SES adapter
/*
app.mailInit({
  adapter: 'ses',
  from: 'noreply@myapp.com',
  connection: {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
*/

// Example 9: Using Resend adapter
/*
app.mailInit({
  adapter: 'resend',
  from: 'noreply@myapp.com',
  connection: {
    apiKey: process.env.RESEND_API_KEY
  }
});
*/

// Example 10: With queue integration
/*
app.mailInit({
  adapter: 'nodemailer',
  from: 'noreply@myapp.com',
  connection: { ... },
  queue: {
    enabled: true,
    name: 'emails',
    priority: 10,
    attempts: 3
  }
});
*/

app.listen(3000, () => {
  console.log('Email example server running on http://localhost:3000');
  console.log('\nAvailable endpoints:');
  console.log('  POST /send-simple');
  console.log('  POST /send-html');
  console.log('  POST /send-template');
  console.log('  POST /send-with-attachment');
  console.log('  POST /send-bulk');
});
