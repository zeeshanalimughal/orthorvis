const mongoose = require("mongoose");

const CaseSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxLength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxLength: [50, "Middle name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxLength: [50, "Last name cannot exceed 50 characters"],
    },
    patientId: {
      type: String,
      required: [true, "Patient ID is required"],
      trim: true,
      unique: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other"],
    },
    birthDate: {
      type: Date,
      required: [true, "Birth date is required"],
    },

    status: {
      type: String,
      enum: ["In Process", "Cancelled", "Completed"],
      default: "In Process",
    },

    files: [
      {
        name: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        relativePath: {
          type: String,
          default: '',
        },
        size: {
          type: Number,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    folderStructure: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    folderName: {
      type: String,
      default: function() {
        return `case_${this._id}_${Date.now()}`;
      },
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

CaseSchema.virtual("fullName").get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

CaseSchema.set("toJSON", { virtuals: true });
CaseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Case", CaseSchema);
