#!/usr/bin/env node

/**
 * Test Registration with Valid Email
 */

async function testValidRegistration() {
  console.log('🔍 Testing registration with valid email format...');

  try {
    const userData = {
      email: 'testuser123@gmail.com', // Use a more standard email format
      username: 'testuser123',
      password: 'TestPassword123!'
    };

    console.log('Making registration request...');
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('🎉 REGISTRATION SUCCESSFUL!');
      console.log('User ID:', data.data.user.id);
      console.log('Token received:', !!data.data.token);
      console.log('Username:', data.data.user.username);
    } else {
      console.log('❌ Registration failed, but got better error');
    }

  } catch (error) {
    console.error('💥 Request error:', error.message);
  }
}

testValidRegistration().catch(console.error);