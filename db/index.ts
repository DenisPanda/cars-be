import { connect } from 'mongoose';

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.4nih2.mongodb.net/car-app?retryWrites=true&w=majority`;

const initDB = () => {
    return connect(uri)
}

export default initDB;