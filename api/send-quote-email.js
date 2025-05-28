// api/send-quote-email.js (or pages/api/send-quote-email.js)
// REPLACE YOUR ENTIRE FILE WITH THIS CODE

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }

    const { 
      customerEmail, 
      customerName, 
      customerPhone,
      products, 
      totalPrice,
      totalSlabs,
      averageEfficiency 
    } = req.body;

    console.log('Sending email to:', customerEmail);

    // Import and initialize Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format products for HTML table
    const productRows = products.map(p => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${p.stone}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${p.dimensions}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${p.slabs}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${p.price}</td>
      </tr>
    `).join('');

    // HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 700px; 
            margin: 0 auto; 
            background: #ffffff;
          }
          .header { 
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 2.5em; 
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 1.1em;
            margin-bottom: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th { 
            background-color: #f3f4f6; 
            padding: 15px 10px; 
            text-align: left; 
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .total-section {
            background: #f0fdf4;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border: 2px solid #86efac;
          }
          .total-amount { 
            font-size: 2em; 
            font-weight: bold; 
            color: #059669; 
            margin: 0;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
          }
          .stat-box {
            text-align: center;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            flex: 1;
            margin: 0 10px;
          }
          .stat-box h3 {
            margin: 0 0 10px 0;
            color: #6b7280;
            font-size: 0.9em;
            text-transform: uppercase;
          }
          .stat-box .value {
            font-size: 2em;
            font-weight: bold;
            color: #1e40af;
          }
          .footer {
            background-color: #1f2937;
            color: #d1d5db;
            padding: 30px;
            text-align: center;
          }
          .footer a {
            color: #60a5fa;
            text-decoration: none;
          }
          .info-section {
            background: #e0e7ff;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .info-section p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
