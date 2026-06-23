import User from './models/User';

export const seedAdmin = async (): Promise<void> => {
  try {
    const existing = await User.findOne({ email: 'mahamood.roshan@tcs.com' });
    if (existing) return;

    await User.create({
      name: 'Mahamood Roshan',
      email: 'mahamood.roshan@tcs.com',
      password: '2166602',
      role: 'admin',
      points: 0,
      joinedDate: new Date(),
    });

    console.log('✅ Admin user seeded');
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  }
};
