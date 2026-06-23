import User from './models/User';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin';

    if (!adminEmail || !adminPassword) {
      console.log('⏭  Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD env vars not set');
      return;
    }

    const existing = await User.findOne({ email: adminEmail });
    if (existing) return;

    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      points: 0,
      joinedDate: new Date(),
    });

    console.log('✅ Admin user seeded');
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  }
};
