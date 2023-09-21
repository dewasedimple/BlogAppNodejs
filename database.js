const mongoose = require('mongoose');


const connectDB = async () => {
    try {
      const conn = await mongoose.connect(`mongodb+srv://dimpledewase8421:dimpledewase8421@sample.mkjpgai.mongodb.net/Blog`, {
        useNewUrlParser: true,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(error.message);
      
    }

  }
  module.exports = {connectDB};