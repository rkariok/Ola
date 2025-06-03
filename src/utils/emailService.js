// Save this as: utils/emailService.js

export const sendQuoteEmail = async (userInfo, allResults, stoneOptions) => {
  if (!userInfo.email || !userInfo.name) {
    alert("Please fill in customer name and email first!");
    return { success: false, error: "Missing customer information" };
  }

  if (allResults.length === 0) {
    alert("Please calculate estimates first!");
    return { success: false, error: "No results to send" };
  }

  try {
    if (!window.emailjs) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    
    window.emailjs.init("GiLTtkDDw2VZi0isD");
    
    const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2);
    const totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
    const avgEfficiency = allResults.length > 0 ? 
      (allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1) : '0';
    
    // Create beautiful HTML email content
    const emailHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="${window.location.origin}/AIC.jpg" alt="AIC Surfaces" style="width: 80px; height: 80px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          <h1 style="color: white; margin: 0; font-size: 32px;">AIC SURFACES</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 2px;">PREMIUM STONE QUOTE</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #4b5563; margin-bottom: 30px;">Dear ${userInfo.name},</p>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
            Thank you for choosing AIC Surfaces! We're excited to present your personalized stone fabrication quote, 
            optimized using our advanced AI layout system to minimize waste and maximize value.
          </p>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #0f766e; margin: 0 0 20px 0; font-size: 24px;">Your Quote Summary</h2>
            
            <div style="display: inline-block; margin: 0 15px;">
              <div style="color: #14b8a6; font-size: 36px; font-weight: bold;">$${totalPrice}</div>
              <div style="color: #6b7280; font-size: 14px;">Total Investment</div>
            </div>
            
            <div style="display: inline-block; margin: 0 15px;">
              <div style="color: #14b8a6; font-size: 36px; font-weight: bold;">${totalSlabs}</div>
              <div style="color: #6b7280; font-size: 14px;">Slabs Required</div>
            </div>
            
            <div style="display: inline-block; margin: 0 15px;">
              <div style="color: #14b8a6; font-size: 36px; font-weight: bold;">${avgEfficiency}%</div>
              <div style="color: #6b7280; font-size: 14px;">Material Efficiency</div>
            </div>
          </div>
          
          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">Types in Your Quote:</h3>
            ${allResults.map(p => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: #1f2937;">${p.customName || 'Type'}</strong>
                    <div style="color: #6b7280; font-size: 14px;">${p.stone} • ${p.width}"×${p.depth}" • Qty: ${p.quantity}</div>
                  </div>
                  <div style="color: #059669; font-size: 20px; font-weight: bold;">$${p.result?.finalPrice?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Accept Quote &amp; Schedule Consultation
            </a>
          </div>
          
          <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <strong>Next Steps:</strong><br>
              1. Review your quote details<br>
              2. Click the button above to accept<br>
              3. We'll contact you within 24 hours to schedule your template<br>
              4. Your dream countertops will be ready in 2-3 weeks!
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">
              This quote is valid for 30 days • Questions? Call (555) 123-4567<br>
              Generated on ${new Date().toLocaleDateString()} • Powered by AI Optimization
            </p>
          </div>
        </div>
      </div>
    `;
    
    const templateParams = {
      to_email: userInfo.email,
      to_name: userInfo.name,
      phone: userInfo.phone || 'Not provided',
      total_price: '$' + totalPrice,
      total_slabs: totalSlabs.toString(),
      average_efficiency: avgEfficiency + '%',
      types_list: allResults.map(p => 
        `- ${p.customName || 'Type'}: ${p.stone} ${p.width}"×${p.depth}" (Qty: ${p.quantity}) - $${p.result?.finalPrice?.toFixed(2) || '0.00'}`
      ).join('\n'),
      quote_date: new Date().toLocaleDateString(),
      html_content: emailHTML
    };

    const response = await window.emailjs.send(
      'service_4xwxsbp',
      'template_pw68h0p',
      templateParams
    );

    if (response.status === 200) {
      alert(`✅ Quote sent successfully to ${userInfo.email}!\n\nThe customer will receive a beautifully formatted quote with all details.`);
      return { success: true };
    } else {
      throw new Error('Failed to send email');
    }
    
  } catch (error) {
    console.error('Failed to send email:', error);
    alert(`❌ Failed to send email: ${error.message || 'Unknown error'}\n\nPlease check your EmailJS configuration and try again.`);
    return { success: false, error: error.message };
  }
};
