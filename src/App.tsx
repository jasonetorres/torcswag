import React, { useState } from 'react';
import { Shirt, User, MapPin, Mail, Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  tshirtSize: string;
  hoodieSize: string;
  isEmployee: boolean;
  manager: string;
  firstChoice: string;
  secondChoice: string;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SWAG_OPTIONS = [
  'T-Shirt Only',
  'Hoodie Only', 
  'Both T-Shirt and Hoodie',
  'Neither (Just want to be included)'
];

function App() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    address: '',
    city: '',
    stateProvince: '',
    zipCode: '',
    country: '',
    tshirtSize: 'M',
    hoodieSize: 'M',
    isEmployee: false,
    manager: '',
    firstChoice: 'T-Shirt Only',
    secondChoice: 'Hoodie Only'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Add timestamp to the data
      const dataToSubmit = {
        ...formData,
        submittedAt: new Date().toISOString()
      };
      
      console.log('Submitting form data:', dataToSubmit);
      
      // Submit directly to Google Sheets
      const response = await fetch('https://script.google.com/macros/s/AKfycbzY0TGrg-mwgelTyEUtNejiVW0dUwQ0J8TIYGQahvTRkGr3_QQEEk9q6aL2TqfgahU1/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        setSubmitStatus('error');
        setErrorMessage(`Invalid response from Google Sheets: ${responseText.substring(0, 200)}`);
        return;
      }

      if (result.success) {
        setSubmitStatus('success');
        console.log('Form submitted successfully to row:', result.row);
        
        // Reset form on success
        setFormData({
          name: '',
          email: '',
          address: '',
          city: '',
          stateProvince: '',
          zipCode: '',
          country: '',
          tshirtSize: 'M',
          hoodieSize: 'M',
          isEmployee: false,
          manager: '',
          firstChoice: 'T-Shirt Only',
          secondChoice: 'Hoodie Only'
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to submit order');
        console.error('Submission failed:', result.error);
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      setErrorMessage(`Network error: ${error instanceof Error ? error.message : 'Failed to connect to Google Sheets'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOld = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/submit-swag-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        setSubmitStatus('error');
        setErrorMessage(`Server returned non-JSON response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        return;
      }

      if (result.success) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          name: '',
          email: '',
          address: '',
          city: '',
          stateProvince: '',
          zipCode: '',
          country: '',
          tshirtSize: 'M',
          hoodieSize: 'M',
          isEmployee: false,
          manager: '',
          firstChoice: 'T-Shirt Only',
          secondChoice: 'Hoodie Only'
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to submit order');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3">
            <img src="/toetovf.png" alt="torc logo" className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-white">torc swag store</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/70 rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-zinc-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-highlight rounded-full mb-4">
                <Shirt className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Your torc Swag</h2>
              <p className="text-gray-400">Thanks for wanting to rep some TORC swag! Head over to <a href="http://torc.printful.me" className="text-highlight hover:underline">torc.printful.me</a> to find our current swag offerings, then enter data below.</p>
            </div>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-900 border border-green-800 rounded-lg flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-200">Your swag order has been submitted successfully!</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-900 border border-red-800 rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                  <User className="w-5 h-5 text-highlight" />
                  <span>Personal Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-highlight" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-highlight" />
                  <span>Shipping Address</span>
                </h3>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="stateProvince" className="block text-sm font-medium text-gray-400 mb-1">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      id="stateProvince"
                      name="stateProvince"
                      required
                      value={formData.stateProvince}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                      placeholder="State/Province"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-400 mb-1">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                      placeholder="12345"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-400 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    placeholder="United States"
                  />
                </div>
              </div>

              {/* Employee Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-highlight" />
                  <span>Employment Information</span>
                </h3>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isEmployee"
                    name="isEmployee"
                    checked={formData.isEmployee}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-highlight border-gray-300 rounded focus:ring-highlight"
                  />
                  <label htmlFor="isEmployee" className="text-sm font-medium text-gray-400">
                    I am a torc employee
                  </label>
                </div>
                
                {formData.isEmployee && (
                  <div>
                    <label htmlFor="manager" className="block text-sm font-medium text-gray-400 mb-1">
                      Manager Name *
                    </label>
                    <input
                      type="text"
                      id="manager"
                      name="manager"
                      required={formData.isEmployee}
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                      placeholder="Enter your manager's name"
                    />
                  </div>
                )}
              </div>

              {/* Swag Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                  <Shirt className="w-5 h-5 text-highlight" />
                  <span>Swag Preferences</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstChoice" className="block text-sm font-medium text-gray-400 mb-1">
                      First Choice *
                    </label>
                    <select
                      id="firstChoice"
                      name="firstChoice"
                      required
                      value={formData.firstChoice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    >
                      {SWAG_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="secondChoice" className="block text-sm font-medium text-gray-400 mb-1">
                      Second Choice *
                    </label>
                    <select
                      id="secondChoice"
                      name="secondChoice"
                      required
                      value={formData.secondChoice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    >
                      {SWAG_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tshirtSize" className="block text-sm font-medium text-gray-400 mb-1">
                      T-Shirt Size
                    </label>
                    <select
                      id="tshirtSize"
                      name="tshirtSize"
                      value={formData.tshirtSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    >
                      {SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="hoodieSize" className="block text-sm font-medium text-gray-400 mb-1">
                      Hoodie Size
                    </label>
                    <select
                      id="hoodieSize"
                      name="hoodieSize"
                      value={formData.hoodieSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent transition-colors"
                    >
                      {SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-highlight text-white py-3 px-6 rounded-lg font-semibold hover:bg-highlight-dark focus:outline-none focus:ring-2 focus:ring-highlight focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <img src="/toetovf.png" alt="torc logo" className="w-4 h-4" />
                      <span>Submit Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;