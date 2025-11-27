import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  }
});

const Update= mongoose.model('Update', updateSchema);

export default Update;