const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, currency, publisherName, campaignTitle, schedule } = JSON.parse(event.body);

    // Calculate AdSeeker 5% commission
    const commissionAmount = Math.round(amount * 0.05);
    const publisherAmount = amount - commissionAmount;

    // Create a Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents (e.g. 240000 = €2400)
      currency: currency || 'eur',
      metadata: {
        publisherName,
        campaignTitle,
        schedule,
        commission: commissionAmount,
        publisherReceives: publisherAmount
      },
      description: `AdSeeker deal: ${campaignTitle} - ${publisherName} (${schedule})`,
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        commission: commissionAmount,
        publisherReceives: publisherAmount
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
