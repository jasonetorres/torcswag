import React, { useState } from 'react';
import { Package, Shirt, User, MapPin, Globe, Users } from 'lucide-react';

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

const initialFormData: FormData = {
  name: '',
  email: '',
  address: '',
  city: '',
  stateProvince: '',
  zipCode: '',
  country: '',
  tshirtSize: '',
  hoodieSize: '',
  isEmployee: false,
  manager: '',
  firstChoice: '',
  secondChoice: ''
};

const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const merchOptions = [
  'Torc Tote Bag - From $15.50',
  'Torc Severance Shirt - From $21.00',
  'Torc Bit Shirt - From $9.50',
  'Torc Community Hoodie - From $46.00',
  'Torc Dev Hoodie - From $46.00',
  'Torc Community T-Shirt'
];

function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.stateProvince.trim()) newErrors.stateProvince = 'State/Province is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip Code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.tshirtSize) newErrors.tshirtSize = 'T-shirt size is required';
    if (!formData.hoodieSize) newErrors.hoodieSize = 'Hoodie size is required';
    if (formData.isEmployee && !formData.manager.trim()) {
      newErrors.manager = 'Manager name is required for employees';
    }
    if (!formData.firstChoice) newErrors.firstChoice = 'First choice is required';
    if (!formData.secondChoice) newErrors.secondChoice = 'Second choice is required';
    if (formData.firstChoice === formData.secondChoice && formData.firstChoice) {
      newErrors.secondChoice = 'Second choice must be different from first choice';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitOrder();
    }
  };
  
  const submitOrder = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      alert('Supabase configuration is missing. Please connect to Supabase first.');
      return;
    }
    
    const apiUrl = `${supabaseUrl}/functions/v1/submit-swag-order`;

    console.log('Submitting to:', apiUrl);
    console.log('Form data:', formData);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error(`Invalid response format: ${responseText}`);
      }

      console.log('Supabase Edge Function response:', result);

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`There was an error submitting your order: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for more details.`);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Order Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for your swag order. We'll review your preferences and get back to you soon with next steps.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData(initialFormData);
            }}
            className="bg-[#0044ff] text-white px-6 py-2 rounded-lg hover:bg-[#0044ff]/80 transition-colors"
          >
            Submit Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <img 
              src="/toetovf.png" 
              alt="TORC Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">TORC Swag Store</h1>
              <p className="text-gray-300">Order your favorite TORC merchandise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Welcome Section */}
          <div className="bg-[#0044ff] px-8 py-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Thanks for wanting to rep some TORC swag!</h2>
            <p className="text-blue-100">Head over to <a href="https://torc.printful.me" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">torc.printful.me</a> to find our current swag offerings, then enter data below.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-[#0044ff]" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.name ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.email ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                    placeholder="your.email@company.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#0044ff]" />
                Shipping Address
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.address ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                    placeholder="123 Main Street, Apt 4B"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.city ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                    placeholder="San Francisco"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="stateProvince" className="block text-sm font-medium text-gray-300 mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      id="stateProvince"
                      name="stateProvince"
                      value={formData.stateProvince}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                        errors.stateProvince ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                      }`}
                      placeholder="California"
                    />
                    {errors.stateProvince && <p className="mt-1 text-sm text-red-600">{errors.stateProvince}</p>}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-2">
                      Zip Code *
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                        errors.zipCode ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                      }`}
                      placeholder="94105"
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.country ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                    placeholder="United States"
                  />
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
              </div>
            </div>

            {/* Sizing Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shirt className="w-5 h-5 mr-2 text-[#0044ff]" />
                Sizing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tshirtSize" className="block text-sm font-medium text-gray-300 mb-2">
                    T-Shirt Size *
                  </label>
                  <select
                    id="tshirtSize"
                    name="tshirtSize"
                    value={formData.tshirtSize}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.tshirtSize ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Select size</option>
                    {sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.tshirtSize && <p className="mt-1 text-sm text-red-600">{errors.tshirtSize}</p>}
                </div>

                <div>
                  <label htmlFor="hoodieSize" className="block text-sm font-medium text-gray-300 mb-2">
                    Hoodie Size *
                  </label>
                  <select
                    id="hoodieSize"
                    name="hoodieSize"
                    value={formData.hoodieSize}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.hoodieSize ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Select size</option>
                    {sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.hoodieSize && <p className="mt-1 text-sm text-red-600">{errors.hoodieSize}</p>}
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#0044ff]" />
                Employment Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isEmployee"
                    name="isEmployee"
                    checked={formData.isEmployee}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#0044ff] focus:ring-[#0044ff] border-gray-600 bg-gray-800 rounded"
                  />
                  <label htmlFor="isEmployee" className="ml-2 block text-sm text-gray-300">
                    I am a TORC employee
                  </label>
                </div>

                {formData.isEmployee && (
                  <div className="ml-6">
                    <label htmlFor="manager" className="block text-sm font-medium text-gray-300 mb-2">
                      Manager Name *
                    </label>
                    <input
                      type="text"
                      id="manager"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className={`w-full max-w-md px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                        errors.manager ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                      }`}
                      placeholder="Enter your manager's name"
                    />
                    {errors.manager && <p className="mt-1 text-sm text-red-600">{errors.manager}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Merchandise Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-[#0044ff]" />
                Merchandise Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstChoice" className="block text-sm font-medium text-gray-300 mb-2">
                    First Choice *
                  </label>
                  <select
                    id="firstChoice"
                    name="firstChoice"
                    value={formData.firstChoice}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.firstChoice ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Select your first choice</option>
                    {merchOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.firstChoice && <p className="mt-1 text-sm text-red-600">{errors.firstChoice}</p>}
                </div>

                <div>
                  <label htmlFor="secondChoice" className="block text-sm font-medium text-gray-300 mb-2">
                    Second Choice *
                  </label>
                  <select
                    id="secondChoice"
                    name="secondChoice"
                    value={formData.secondChoice}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#0044ff] focus:border-[#0044ff] transition-colors ${
                      errors.secondChoice ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Select your second choice</option>
                    {merchOptions.filter(option => option !== formData.firstChoice).map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.secondChoice && <p className="mt-1 text-sm text-red-600">{errors.secondChoice}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-[#0044ff] text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-[#0044ff]/80 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Submit Swag Order
              </button>
              <p className="text-sm text-gray-400 mt-3 text-center">
                We'll review your order and get back to you with availability and shipping details.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-400 text-sm">
        <p>© 2025 TORC. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;