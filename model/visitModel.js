import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema({
    ip: {
        type: String,
        index: true
    },
    browser: {
        name: String,
        version: String
    },
    os: {
        name: String,
        version: String
    },
    device: {
        type: String,
        index: true
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

export default mongoose.model("Visit", VisitSchema);