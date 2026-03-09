import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const roleSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    trim: true
  },

  email: { 
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: { 
    type: String,
    required: true
  },

  role: { 
    type: String,
    enum: ['admin','manager','supervisor','user'],
    default: "manager"
  },

  status: {
    type: String,
    enum: ['Active','Inactive','Suspended'],
    default: "Active"
  },

  permissions: {
    type: [String],
    default: []
  },

  lastLogin: Date,

  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }

},{timestamps:true});


// PASSWORD HASH
roleSchema.pre("save", async function(){

  if(!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password,salt);

});


// PASSWORD COMPARE
roleSchema.methods.comparePassword = async function(password){
  return await bcrypt.compare(password,this.password);
};


export default mongoose.model("Role",roleSchema);