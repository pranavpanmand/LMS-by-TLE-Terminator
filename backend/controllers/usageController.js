import User from "../models/userModel.js";

export const updateUsage = async (req, res) => {
  try {

    const userId = req.userId;

    // ensure minutes is a number
    const minutes = Number(req.body.minutes) || 0;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ensure fields exist
    if (!user.dailyUsage) user.dailyUsage = [];
    if (typeof user.continuousUsageMinutes !== "number") {
      user.continuousUsageMinutes = 0;
    }

    const today = new Date().toISOString().split("T")[0];

    // find today's usage
    let todayUsage = user.dailyUsage.find((d) => d.date === today);

    if (!todayUsage) {

      user.dailyUsage.push({
        date: today,
        minutesSpent: minutes,
      });

    } else {

      todayUsage.minutesSpent += minutes;
    }

    // keep only last 30 days
    if (user.dailyUsage.length > 30) {
      user.dailyUsage = user.dailyUsage.slice(-30);
    }

    // update continuous usage
    user.continuousUsageMinutes += minutes;

    await user.save();

    const todayUsageUpdated = user.dailyUsage.find((d) => d.date === today);

    return res.json({
      success: true,
      continuousUsageMinutes: user.continuousUsageMinutes,
      todayMinutes: todayUsageUpdated?.minutesSpent || 0,
    });

  } catch (error) {
    console.error("🔴 [USAGE ERROR]", error);
    res.status(500).json({ message: "Usage update failed" });
  }
};

export const resetContinuousUsage = async (req, res) => {
  try {

    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      continuousUsageMinutes: 0,
      currentSessionStart: null,
    });

    res.json({ success: true });

  } catch (error) {
    console.error("🔴 [RESET ERROR]", error);
    res.status(500).json({ message: "Reset failed" });
  }
};