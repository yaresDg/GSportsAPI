import mongoose from "mongoose";
import crypto from "crypto";
import { DateTime } from "luxon";

const ManualEventSchema = new mongoose.Schema({
    idEvent:{
        type: String,
        required: true,
        default: () => `manual-${crypto.randomUUID()}`
    },
    strEvent: { type: String, required: true },
    strHomeTeam: { type: String, required: false },
    strAwayTeam: { type: String, required: false },
    strLeague: { type: String },
    idLeague: { type: String },
    strTimestamp: { type: Date, required: true },
    strEventEnd: { type: Date, required: false },
    station_ids: {
        type: [String],
        default: []
    },
    station_affiliations: {
        type: Map,
        of: String,
        default: {}
    }
});

ManualEventSchema.pre('save', function(next) {
    if (this.strEventEnd && this.strTimestamp) {
      // Convertir a DateTime para comparar solo las horas
      const startTime = DateTime.fromJSDate(this.strTimestamp);
      const endTime = DateTime.fromJSDate(this.strEventEnd);
      // Si la hora de fin es menor que la hora de inicio, asumir día siguiente
      if (endTime < startTime) {
        this.strEventEnd = endTime.plus({ days: 1 }).toJSDate();
      }
    }
    next();
});

const ManualEvent= mongoose.model("ManualEvent", ManualEventSchema);

export default ManualEvent;