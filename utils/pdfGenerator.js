// Save this as: utils/pdfGenerator.js

export const generateQuotePDF = (allResults, userInfo, stoneOptions) => {
  console.log('generateQuotePDF function called!');
  
  if (!allResults || allResults.length === 0) {
    alert("Please calculate estimates first");
    return;
  }

  const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2);
  const totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
  const avgEfficiency = allResults.length > 0 ? 
    (allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1) : '0';

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  
  if (!printWindow) {
    console.log('Popup blocked, trying alternative method...');
    showPrintView(allResults, userInfo, stoneOptions);
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AIC Surfaces - Premium Stone Quote</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          color: #1a1a1a;
          line-height: 1.6;
          background: #ffffff;
        }
        
        .page-container {
          max-width: 850px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        
        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #e5e7eb;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .company-info h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #0f766e;
          margin-bottom: 4px;
        }
        
        .company-info p {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        
        .quote-number {
          text-align: right;
        }
        
        .quote-number h2 {
          font-size: 24px;
          color: #0f766e;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .quote-number p {
          color: #6b7280;
          font-size: 14px;
        }
        
        /* Trust Markers */
        .trust-markers {
          background: #f0fdfa;
          border: 1px solid #5eead4;
          border-radius: 12px;
          padding: 16px 24px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-around;
          gap: 30px;
        }
        
        .trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #0f766e;
          font-weight: 500;
        }
        
        .trust-item .icon {
          color: #10b981;
          font-size: 18px;
        }
        
        /* Customer Section */
        .customer-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .customer-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .customer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .customer-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .customer-field label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .customer-field value {
          font-size: 16px;
          color: #1f2937;
          font-weight: 500;
        }
        
        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .summary-card.primary {
          background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
          color: white;
          border: none;
        }
        
        .summary-card.primary .label { color: #a7f3d0; }
        
        .summary-card .value {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .summary-card .label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* Products Section */
        .products-section {
          margin-bottom: 30px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .section-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .product-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .product-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .product-price {
          font-size: 24px;
          font-weight: 700;
          color: #059669;
        }
        
        .product-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .efficiency-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .efficiency-high {
          background: #d1fae5;
          color: #065f46;
        }
        
        .efficiency-medium {
          background: #fef3c7;
          color: #92400e;
        }
        
        .efficiency-low {
          background: #fee2e2;
          color: #991b1b;
        }
        
        /* Footer Section */
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
        }
        
        .footer-content {
          margin-bottom: 20px;
        }
        
        .footer-content p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4b5563;
          font-size: 14px;
        }
        
        .tagline {
          font-style: italic;
          color: #9ca3af;
          font-size: 13px;
          margin-top: 20px;
        }
        
        @media print { 
          .no-print { display: none !important; }
          body { background: white; }
          .page-container { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="${window.location.origin}/AIC.jpg" alt="AIC Surfaces" class="logo" onerror="this.style.display='none'" />
            <div class="company-info">
              <h1>AIC SURFACES</h1>
              <p>PREMIUM STONE FABRICATION</p>
            </div>
          </div>
          <div class="quote-number">
            <h2>QUOTE #${Date.now().toString().slice(-6)}</h2>
            <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        
        <!-- Trust Markers -->
        <div class="trust-markers">
          <div class="trust-item">
            <span class="icon">✓</span>
            <span>Licensed & Insured</span>
          </div>
          <div class="trust-item">
            <span class="icon">✓</span>
            <span>20+ Years Experience</span>
          </div>
          <div class="trust-item">
            <span class="icon">✓</span>
            <span>AI-Optimized Layouts</span>
          </div>
          <div class="trust-item">
            <span class="icon">✓</span>
            <span>Best Price Guarantee</span>
          </div>
        </div>
        
        <!-- Customer Information -->
        <div class="customer-section">
          <h3>
            <span>👤</span>
            Customer Information
          </h3>
          <div class="customer-grid">
            <div class="customer-field">
              <label>Full Name</label>
              <value>${userInfo.name || 'Not Provided'}</value>
            </div>
            <div class="customer-field">
              <label>Email Address</label>
              <value>${userInfo.email || 'Not Provided'}</value>
            </div>
            <div class="customer-field">
              <label>Phone Number</label>
              <value>${userInfo.phone || 'Not Provided'}</value>
            </div>
          </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card primary">
            <div class="value">$${totalPrice}</div>
            <div class="label">Total Investment</div>
          </div>
          <div class="summary-card">
            <div class="value">${totalSlabs}</div>
            <div class="label">Slabs Required</div>
          </div>
          <div class="summary-card">
            <div class="value">${avgEfficiency}%</div>
            <div class="label">Avg. Efficiency</div>
          </div>
        </div>
        
        <!-- Products -->
        <div class="products-section">
          <div class="section-header">
            <span style="font-size: 24px;">📦</span>
            <h3>Quote Details</h3>
          </div>
          
          ${allResults.map((p, i) => {
            const effClass = p.result?.efficiency > 80 ? 'efficiency-high' : 
                            p.result?.efficiency > 60 ? 'efficiency-medium' : 'efficiency-low';
            return `
              <div class="product-card">
                <div class="product-header">
                  <div class="product-name">${p.customName || `Product ${i + 1}`}</div>
                  <div class="product-price">$${p.result?.finalPrice?.toFixed(2) || '0.00'}</div>
                </div>
                <div class="product-details">
                  <div class="detail-item">
                    <div class="detail-label">Stone Type</div>
                    <div class="detail-value">${p.stone}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Dimensions</div>
                    <div class="detail-value">${p.width}" × ${p.depth}"</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Quantity</div>
                    <div class="detail-value">${p.quantity} pieces</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Edge Detail</div>
                    <div class="detail-value">${p.edgeDetail}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Area</div>
                    <div class="detail-value">${p.result?.usableAreaSqft?.toFixed(1) || '0'} sq ft</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Slabs</div>
                    <div class="detail-value">${p.result?.totalSlabsNeeded || '0'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Per Slab</div>
                    <div class="detail-value">${p.result?.topsPerSlab || '0'} pieces</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Efficiency</div>
                    <div class="detail-value">
                      <span class="efficiency-badge ${effClass}">
                        ${p.result?.efficiency?.toFixed(0) || '0'}%
                      </span>
                    </div>
                  </div>
                </div>
                ${p.note ? `
                  <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px; color: #92400e;">
                    <strong>Note:</strong> ${p.note}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <p><strong>This quote is valid for 30 days from the date above</strong></p>
            <p>Prices subject to material availability and final measurements</p>
            
            <div class="contact-info">
              <div class="contact-item">
                <span>📞</span>
                <span>(555) 123-4567</span>
              </div>
              <div class="contact-item">
                <span>✉️</span>
                <span>quotes@aicsurfaces.com</span>
              </div>
              <div class="contact-item">
                <span>🌐</span>
                <span>www.aicsurfaces.com</span>
              </div>
            </div>
          </div>
          
          <p class="tagline">Generated by AIC Surfaces Stone Estimator • Powered by AI Optimization</p>
        </div>
      </div>
      
      <div class="no-print" style="text-align: center; margin: 40px;">
        <button onclick="window.print()" style="
          padding: 16px 40px;
          background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          Print / Save as PDF
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

const showPrintView = (allResults, userInfo, stoneOptions) => {
  const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2);
  const totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
  
  const originalContent = document.body.innerHTML;
  
  document.body.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: -apple-system, sans-serif;">
      <h1 style="text-align: center; color: #0f766e; font-size: 32px;">AIC SURFACES - QUOTE</h1>
      <p style="text-align: center; color: #6b7280;">Customer: ${userInfo.name || 'N/A'} | Date: ${new Date().toLocaleDateString()}</p>
      
      <div style="margin: 40px 0; padding: 20px; background: #f0fdfa; border-radius: 12px; text-align: center;">
        <h2 style="color: #0f766e; margin-bottom: 10px;">Total: $${totalPrice}</h2>
        <p style="color: #14b8a6;">Slabs Required: ${totalSlabs}</p>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <button onclick="window.print()" style="
          padding: 16px 40px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          margin-right: 10px;
        ">
          Print / Save as PDF
        </button>
        <button onclick="location.reload()" style="
          padding: 16px 40px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
        ">
          Go Back
        </button>
      </div>
    </div>
  `;
  
  window.print();
};