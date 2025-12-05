import mongoose from "mongoose";

const ManualEventSchema = new mongoose.Schema({
    idEvent:{
        type: String,
        required: true
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