import { MongoClient } from 'mongodb';
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'fastify_app';
const client = new MongoClient(url);
export const connectDB = async () => {
    try {
        await client.connect();
        console.log('✅ MongoDB connected');
    }
    catch (error) {
        console.log("MongoDb connection failed...");
    }
};
export const getDB = () => client.db(dbName);
//# sourceMappingURL=db.js.map