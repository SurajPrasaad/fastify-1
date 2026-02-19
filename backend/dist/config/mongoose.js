import mongoose from 'mongoose';
const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/chat_db';
export async function connectMongoose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Mongoose connected to MongoDB');
    }
    catch (err) {
        console.error('❌ Mongoose connection error:', err);
        process.exit(1);
    }
}
//# sourceMappingURL=mongoose.js.map