import mongoose from "mongoose";
import crypto from "crypto";

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

const ManualEvent= mongoose.model("ManualEvent", ManualEventSchema);

export default ManualEvent;