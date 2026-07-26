const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'seif1234';

async function ensureDefaultAdmin(UserModel, options = {}) {
    const email = (options.email || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const password = options.password || DEFAULT_ADMIN_PASSWORD;

    let user = await UserModel.findOne({ email });

    if (!user) {
        user = new UserModel({
            email,
            password,
            role: 'admin'
        });
        await user.save();
        return { created: true, user };
    }

    if (user.role !== 'admin') {
        user.role = 'admin';
    }

    const isDefaultPassword = await user.comparePassword(password);
    if (!isDefaultPassword) {
        user.password = password;
        await user.save();
    }

    return { created: false, user };
}

module.exports = {
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    ensureDefaultAdmin
};
