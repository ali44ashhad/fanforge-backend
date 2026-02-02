const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();


async function main() {
    // Create super admin
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const hashedPassword = await bcrypt.hash(adminPassword, 10);


    const superAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Super Admin',
            phoneNumber: '+1234567890',
            address: '123 Admin Street',
            role: 'ADMIN',
            isSuperAdmin: true,
        },
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // Create sample categories
    const categories = [
        { name: 'Merchandise', description: 'T-shirts, hoodies, and other merch' },
        { name: 'Records', description: 'Vinyl records and albums' },
        { name: 'Instruments', description: 'Musical instruments and accessories' },
        { name: 'Art Prints', description: 'Posters, prints, and artwork' },
        { name: 'Accessories', description: 'Keychains, stickers, pins, and more' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }

    console.log('✅ Categories created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
