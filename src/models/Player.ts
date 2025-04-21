import mongoose, { Schema } from "mongoose";

const PlayerSchema = new Schema({
    steamId: { type: String, required: true, unique: true },
    mmr: { type: Number },
    stats: {
        farmEfficiency: Number,
        visionScore: Number,
    },
});

export default mongoose.model("Player", PlayerSchema);
