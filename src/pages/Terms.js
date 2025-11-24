import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import TermsModal from '../components/common/TermsModal';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-page">
      <Header />
      <main className="terms-main">
        <div className="terms-container">
          <h1>Terms & Conditions</h1>
          <div className="terms-content">
            {/* Terms content will be displayed here */}
            <p>Please refer to the Terms & Conditions modal for full details.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;



