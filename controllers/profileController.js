import Profile from "../models/Profile.js";


// ✅ GET Profile
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ CREATE Profile (Only One Time)
export const createProfile = async (req, res) => {
  try {
    const existingProfile = await Profile.findOne();

    if (existingProfile) {
      return res.status(400).json({
        message: "Profile already exists. You can only edit or delete."
      });
    }

    const profile = new Profile({
      ...req.body,
      logo: req.file ? req.file.path : ""
    });

    await profile.save();

    res.status(201).json(profile);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ UPDATE Profile
export const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    Object.assign(profile, req.body);

    if (req.file) {
      profile.logo = req.file.path;
    }

    await profile.save();

    res.json(profile);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ DELETE Profile
export const deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    await profile.deleteOne();

    res.json({ message: "Profile deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};