// Custom Headers Examples
// Demonstrates the flexibility of the headers option

import { createApp } from '@morojs/moro';

const app = createApp();

app.mailInit({
  adapter: 'console',
  from: 'noreply@myapp.com',
});

// Example 1: Standard X-headers
app.post('/send-with-standard-headers').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Message with Standard Headers',
    text: 'Hello!',

    headers: {
      'X-Mailer': 'MyApp/2.0.1',
      'X-Priority': '1', // 1=Highest, 3=Normal, 5=Lowest
      'X-MSMail-Priority': 'High',
      'X-Originating-IP': '[192.168.1.1]',
    },
  });

  return { success: result.success };
});

// Example 2: Application tracking headers
app.post('/send-with-tracking').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Tracked Message',
    text: 'This message is tracked',

    headers: {
      // Request correlation
      'X-Request-ID': 'req-abc-123-def-456',
      'X-Correlation-ID': 'corr-xyz-789',

      // User tracking
      'X-User-ID': 'user-12345',
      'X-Session-ID': 'sess-abcdef',

      // Application info
      'X-App-Version': '2.0.1',
      'X-Environment': 'production',
      'X-Region': 'us-west-2',
    },
  });

  return { success: result.success };
});

// Example 3: Marketing campaign headers
app.post('/send-campaign').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'subscriber@example.com',
    subject: 'Special Offer',
    html: '<h1>Black Friday Sale!</h1>',

    headers: {
      // Campaign tracking
      'X-Campaign-ID': 'black-friday-2024',
      'X-Campaign-Name': 'Black Friday Sale',
      'X-Campaign-Type': 'promotional',

      // UTM parameters (for analytics)
      'X-UTM-Source': 'email',
      'X-UTM-Medium': 'newsletter',
      'X-UTM-Campaign': 'black-friday',

      // Segment info
      'X-Segment': 'active-customers',
      'X-Customer-Tier': 'premium',
    },
  });

  return { success: result.success };
});

// Example 4: Transactional headers
app.post('/send-transactional').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'customer@example.com',
    subject: 'Order Confirmation #12345',
    template: 'order-confirmation',
    data: { orderId: '12345' },

    headers: {
      // Transaction tracking
      'X-Transaction-ID': 'txn-12345-abc',
      'X-Order-ID': 'order-12345',
      'X-Payment-ID': 'pay-67890',

      // System info
      'X-Service': 'order-service',
      'X-Message-Type': 'transactional',
      'X-Auto-Generated': 'true',

      // Priority
      'X-Priority': '1', // High priority for transactional
      'X-MSMail-Priority': 'High',
    },
  });

  return { success: result.success };
});

// Example 5: Security and compliance headers
app.post('/send-secure').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Security Alert',
    text: 'Important security information',

    headers: {
      // Security classification
      'X-Classification': 'confidential',
      'X-Sensitivity': 'high',

      // Content security
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',

      // Compliance tracking
      'X-Compliance-Category': 'gdpr',
      'X-Data-Retention': '90-days',
      'X-Encryption-Method': 'TLS-1.3',

      // Audit trail
      'X-Audit-ID': 'audit-12345',
      'X-Created-By': 'security-system',
      'X-Created-At': new Date().toISOString(),
    },
  });

  return { success: result.success };
});

// Example 6: Multi-tenant headers
app.post('/send-multitenant').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'Tenant Message',
    text: 'Message for your organization',

    headers: {
      // Tenant identification
      'X-Tenant-ID': 'tenant-abc-123',
      'X-Organization-ID': 'org-xyz-789',
      'X-Workspace-ID': 'ws-def-456',

      // Resource tracking
      'X-Resource-Type': 'notification',
      'X-Resource-ID': 'notif-12345',

      // Billing
      'X-Billable': 'true',
      'X-Cost-Center': 'marketing',
    },
  });

  return { success: result.success };
});

// Example 7: A/B testing headers
app.post('/send-ab-test').handler(async (req, res) => {
  const variant = Math.random() > 0.5 ? 'A' : 'B';

  const result = await app.sendMail({
    to: 'user@example.com',
    subject: variant === 'A' ? 'Special Offer!' : 'Limited Time Deal!',
    template: `ab-test-${variant}`,
    data: { variant },

    headers: {
      // A/B test tracking
      'X-AB-Test-ID': 'test-subject-lines-001',
      'X-AB-Variant': variant,
      'X-AB-Test-Name': 'Subject Line Test',

      // Experiment tracking
      'X-Experiment-Group': variant === 'A' ? 'control' : 'treatment',
      'X-Experiment-Start': '2024-11-01',
      'X-Experiment-End': '2024-11-30',
    },
  });

  return { success: result.success, variant };
});

// Example 8: API integration headers
app.post('/send-api-triggered').handler(async (req, res) => {
  const result = await app.sendMail({
    to: 'user@example.com',
    subject: 'API Notification',
    text: 'Triggered via API',

    headers: {
      // API tracking
      'X-API-Key-ID': 'key-abc-123',
      'X-API-Version': 'v2',
      'X-API-Endpoint': '/api/v2/notifications/send',

      // Rate limiting
      'X-Rate-Limit': '1000',
      'X-Rate-Limit-Remaining': '998',
      'X-Rate-Limit-Reset': '1699999999',

      // Request context
      'X-Client-IP': '192.168.1.1',
      'X-User-Agent': 'MyApp API Client/1.0',
      'X-Forwarded-For': '203.0.113.195',
    },
  });

  return { success: result.success };
});

app.listen(3000, () => {
  console.log('Custom headers examples running on http://localhost:3000');
  console.log('\nAvailable endpoints:');
  console.log('- POST /send-with-standard-headers');
  console.log('- POST /send-with-tracking');
  console.log('- POST /send-campaign');
  console.log('- POST /send-transactional');
  console.log('- POST /send-secure');
  console.log('- POST /send-multitenant');
  console.log('- POST /send-ab-test');
  console.log('- POST /send-api-triggered');
});
