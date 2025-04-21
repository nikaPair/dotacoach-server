import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
    email: {
        type: String,
        required: function (): boolean {
            return !(this as any).steamId;
        },
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: function (): boolean {
            return (this as any).email && !(this as any).steamId;
        },
    },
    steamId: {
        type: String,
        required: function (): boolean {
            return !(this as any).email;
        },
        unique: true,
        sparse: true,
    },
    steamDisplayName: { type: String },
    steamAvatar: { type: String },
    steamProfile: { type: String },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
});

export default mongoose.model("User", UserSchema);
