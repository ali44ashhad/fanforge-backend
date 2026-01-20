const BASE_URL = 'http://localhost:5001/api';

async function verifyFlow() {
    try {
        console.log('🚀 Starting Seller Flow Verification...');

        // 1. Login as Admin
        console.log('\n🔐 Logging in as Admin...');
        const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@fanforge.com',
                password: 'admin123',
            }),
        });
        const adminData = await adminLogin.json();
        if (!adminData.success) throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
        const adminToken = adminData.data.token;
        console.log('✅ Admin logged in');

        // 2. Register a new user (Potential Seller)
        const timestamp = Date.now();
        const sellerEmail = `seller_${timestamp}@test.com`;
        console.log(`\n👤 Registering new user: ${sellerEmail}...`);
        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: sellerEmail,
                password: 'password123',
                fullName: 'Test Seller',
                phoneNumber: '1234567890',
                address: 'Test Address',
            }),
        });
        const registerData = await registerRes.json();
        if (!registerData.success) throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
        // Login as the new user to get token
        const sellerLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: sellerEmail,
                password: 'password123',
            }),
        });
        const sellerData = await sellerLogin.json();
        const sellerToken = sellerData.data.token;
        const sellerId = sellerData.data.user.id;
        console.log('✅ User registered and logged in');

        // 3. Apply to become a seller
        console.log('\n📝 Applying to become a seller...');
        const applyRes = await fetch(`${BASE_URL}/seller/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sellerToken}`,
            },
            body: JSON.stringify({
                businessName: `Test Business ${timestamp}`,
                businessDescription: 'A very cool test business selling testing supplies.',
                paymentMethods: ['UPI', 'Card'],
                averageShippingCost: 50,
                estimatedDeliveryDays: 3,
                shippingRegions: 'India',
                socialLinks: 'twitter.com/test',
            }),
        });
        const applyData = await applyRes.json();
        if (!applyData.success) {
            console.error('Apply response:', applyData);
            throw new Error('Application failed');
        }
        console.log('✅ Application submitted');

        // 4. Admin checks pending applications
        console.log('\n👀 Admin checking pending applications...');
        const pendingRes = await fetch(`${BASE_URL}/admin/sellers/pending`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });
        const pendingData = await pendingRes.json();
        const myApplication = pendingData.data.find(p => p.userId === sellerId);
        if (!myApplication) throw new Error('Application not found in pending list');
        console.log('✅ Application found in pending list');

        // 5. Admin approves seller
        console.log('\n✅ Admin approving seller...');
        const approveRes = await fetch(`${BASE_URL}/admin/sellers/${myApplication.id}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                sellerType: 'FAN_MADE',
            }),
        });
        const approveData = await approveRes.json();
        if (!approveData.success) throw new Error('Approval failed');
        console.log('✅ Seller approved');

        // 6. Verify User Role is SELLER
        console.log('\n🕵️ Verifying user role updated...');
        // We can check profile again or rely on the admin response details if it returned updated user
        // Let's fetch profile as seller
        const profileRes = await fetch(`${BASE_URL}/seller/profile`, {
            headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const profileData = await profileRes.json();
        if (!profileData.success || !profileData.data.isApproved) throw new Error('Profile verification failed');
        console.log('✅ User profile confirms approval');

        // 7. Seller updates profile
        console.log('\n✏️ Seller updating profile...');
        const updateRes = await fetch(`${BASE_URL}/seller/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sellerToken}`,
            },
            body: JSON.stringify({
                averageShippingCost: 100,
            }),
        });
        const updateData = await updateRes.json();
        if (!updateData.success || updateData.data.averageShippingCost !== 100) throw new Error('Update failed');
        console.log('✅ Profile updated');

        // 8. Admin changes seller type
        console.log('\n🔄 Admin changing seller type...');
        const typeRes = await fetch(`${BASE_URL}/admin/sellers/${myApplication.id}/type`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                sellerType: 'OFFICIAL',
            }),
        });
        const typeData = await typeRes.json();
        if (!typeData.success || typeData.data.sellerType !== 'OFFICIAL') throw new Error('Type change failed');
        console.log('✅ Seller type changed');

        // 9. Admin removes seller
        console.log('\n🗑️ Admin removing seller...');
        const deleteRes = await fetch(`${BASE_URL}/admin/sellers/${myApplication.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });
        const deleteData = await deleteRes.json();
        if (!deleteData.success) throw new Error('Deletion failed');
        console.log('✅ Seller removed');

        console.log('\n✨ All Verification Steps Passed! ✨');
    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

verifyFlow();
