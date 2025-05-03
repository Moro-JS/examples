import Stripe from 'stripe';

interface PaymentRequest {
  amount: number; // Amount in cents
  currency: string;
  paymentMethodId: string;
  orderId: string;
  description?: string;
}

interface PaymentResult {
  paymentId: string;
  status: 'succeeded' | 'failed' | 'pending';
  clientSecret?: string;
}

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.paymentMethodId,
        description: paymentData.description,
        metadata: {
          orderId: paymentData.orderId
        },
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/orders/${paymentData.orderId}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          paymentId: paymentIntent.id,
          status: 'succeeded'
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          paymentId: paymentIntent.id,
          status: 'pending',
          clientSecret: paymentIntent.client_secret || undefined
        };
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      throw new Error(error.message || 'Payment processing failed');
    }
  }

  async handleWebhook(body: any, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );

      console.log('Received Stripe webhook:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    console.log(`Payment succeeded for order: ${orderId}`);
    
    // Here you would typically update the order status in your database
    // Since we don't have the database connection here, we'll emit an event
    // or call the OrderService directly in a real implementation
    
    // Example of what you might do:
    // await this.orderService.updateOrderPaymentStatus(orderId, 'succeeded');
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    console.log(`Payment failed for order: ${orderId}`);
    
    // Update order status to reflect payment failure
    // await this.orderService.updateOrderPaymentStatus(orderId, 'failed');
  }

  private async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    console.log(`Charge dispute created: ${dispute.id}`);
    
    // Handle dispute logic here
    // You might want to:
    // - Notify admin team
    // - Update order status
    // - Prepare dispute response
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount // If not provided, refunds the full amount
      });

      return refund;
    } catch (error: any) {
      console.error('Refund creation error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment: ${error.message}`);
    }
  }

  async createSetupIntent(customerId?: string): Promise<Stripe.SetupIntent> {
    try {
      return await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });
    } catch (error: any) {
      console.error('Setup intent creation error:', error);
      throw new Error(`Setup intent failed: ${error.message}`);
    }
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email,
        name
      });
    } catch (error: any) {
      console.error('Customer creation error:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }
} 