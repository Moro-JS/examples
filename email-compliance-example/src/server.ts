// Email Compliance Example
// Demonstrates compliance headers and features

import { createApp } from '@morojs/moro';

const app = createApp();

app.mailInit({
  adapter: 'console',
  from: 'noreply@myapp.com',
});

// Example 1: Newsletter with compliance headers (RFC 2369)
app.post('/send-newsletter').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'subscriber@example.com',
    subject: 'Monthly Newsletter',
    html: '<h1>Our Newsletter</h1><p>Latest updates...</p>',

    // List management headers (REQUIRED for bulk email compliance)
    listUnsubscribe: [
      'https://myapp.com/unsubscribe?token=xyz123',
      'mailto:unsubscribe@myapp.com?subject=Unsubscribe',
    ],
    listUnsubscribePost: 'List-Unsubscribe=One-Click',
    listId: 'monthly-newsletter.myapp.com',
    listHelp: 'https://myapp.com/help',
    listSubscribe: 'https://myapp.com/subscribe',
    listArchive: 'https://myapp.com/newsletter/archive',

    // Tracking and categorization
    tags: ['newsletter', 'monthly', 'marketing'],
    metadata: {
      campaign: 'monthly-2024-11',
      segment: 'active-users',
    },
  });

  return { success: result.success };
});

// Example 2: Transactional email with threading
app.post('/send-reply').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'support@example.com',
    subject: 'Re: Support Request #12345',
    text: 'This is a follow-up to my previous message...',

    // Threading headers for conversation continuity
    inReplyTo: '<original-message-id@example.com>',
    references: ['<first-message-id@example.com>', '<original-message-id@example.com>'],
    messageId: '<follow-up-message-id@myapp.com>',

    // Sender distinction
    from: { name: 'Support Team', email: 'support@myapp.com' },
    sender: { name: 'Automated System', email: 'noreply@myapp.com' },
    returnPath: 'bounces@myapp.com',
  });

  return { success: result.success };
});

// Example 3: Scheduled email with DSN (Delivery Status Notification)
app.post('/send-scheduled').handler(async (req, res) => {
  const scheduledDate = new Date();
  scheduledDate.setHours(scheduledDate.getHours() + 2);

  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Scheduled Notification',
    text: 'This email was scheduled in advance',

    // Schedule for later (if adapter supports it)
    scheduledAt: scheduledDate,

    // Delivery Status Notification
    dsn: {
      notify: 'failure',
      returnFull: false,
      returnHeaders: true,
    },

    // Custom encoding
    encoding: 'base64',
    textEncoding: 'quoted-printable',
  });

  return { success: result.success, scheduledFor: scheduledDate };
});

// Example 4: Marketing email with full compliance
app.post('/send-marketing').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'customer@example.com',
    subject: 'Special Offer - 50% Off',
    template: 'marketing-offer',
    data: {
      firstName: 'John',
      offerCode: 'SAVE50',
      unsubscribeUrl: 'https://myapp.com/unsubscribe?token=xyz',
    },

    // Critical compliance headers
    listUnsubscribe: 'https://myapp.com/unsubscribe?token=xyz',
    listUnsubscribePost: 'List-Unsubscribe=One-Click',
    listId: 'marketing.myapp.com',

    // Tracking
    tags: ['marketing', 'promotion', 'black-friday'],
    metadata: {
      campaign_id: 'bf-2024',
      utm_source: 'email',
      utm_medium: 'campaign',
      utm_campaign: 'black-friday',
    },

    // Proper sender information
    from: { name: 'MyApp Sales', email: 'sales@myapp.com' },
    replyTo: { name: 'Customer Support', email: 'support@myapp.com' },
    returnPath: 'bounces+marketing@myapp.com',
  });

  return { success: result.success };
});

// Example 5: Transactional email with custom headers
app.post('/send-invoice').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'customer@example.com',
    subject: 'Invoice #INV-2024-001',
    template: 'invoice',
    data: {
      invoiceNumber: 'INV-2024-001',
      amount: '$100.00',
    },

    // Custom headers - add ANY headers you need
    headers: {
      // Standard X-headers
      'X-Mailer': 'MoroJS/1.0',
      'X-Priority': '1', // 1=Highest, 3=Normal, 5=Lowest

      // Application-specific headers
      'X-Invoice-Number': 'INV-2024-001',
      'X-Customer-ID': 'CUST-12345',
      'X-Application-Version': '2.0.1',
      'X-Environment': 'production',

      // Tracking headers
      'X-Campaign-ID': 'billing-2024',
      'X-Message-Type': 'transactional',

      // Security headers
      'X-Content-Security-Policy': "default-src 'self'",

      // Any other custom header you need
      'X-Custom-Header': 'your-value',
    },

    // Message identification
    messageId: '<inv-2024-001@myapp.com>',

    // Proper routing
    from: { name: 'Billing Department', email: 'billing@myapp.com' },
    replyTo: { name: 'Support', email: 'support@myapp.com' },
    returnPath: 'bounces+billing@myapp.com',

    // Tags for internal categorization
    tags: ['transactional', 'invoice', 'billing'],
    metadata: {
      invoice_id: 'INV-2024-001',
      customer_id: 'CUST-12345',
      amount: '100.00',
    },
  });

  return { success: result.success };
});

app.listen(3000, () => {
  console.log('Email compliance example running on http://localhost:3000');
  console.log('\nAvailable endpoints:');
  console.log('  POST /send-newsletter');
  console.log('  POST /send-reply');
  console.log('  POST /send-scheduled');
  console.log('  POST /send-marketing');
  console.log('  POST /send-invoice');
});
