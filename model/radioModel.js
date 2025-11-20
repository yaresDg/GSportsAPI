import mongoose from "mongoose";

const RadioSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    default: ""
  },
  pais: {
    type: String,
    required: true
  },
  id_thesportsdb: {
    type: [String],
    default: []
  },
  streams: {
    type: [String],
    default: []
  },
  external_only: {
    type: Boolean,
    default: false
  }
  },
{timestamps: true});

const Radio = mongoose.model("Radio", RadioSchema);

export default Radio;