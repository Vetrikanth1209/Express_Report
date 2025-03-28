const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance");
const mongoose = require("mongoose");

// ✅ GET: Fetch attendance records
router.get("/get-all-attendance", async (req, res) => {
  try {
    let { mod_id, class_name, poc_id } = req.query;

    if (class_name) class_name = decodeURIComponent(class_name);

    let query = {};
    if (mod_id) query.mod_id = mod_id;
    if (class_name) query.class_name = { $regex: `^${class_name}$`, $options: "i" };
    if (poc_id) query.poc_id = poc_id;

    console.log("🔍 Query:", query);

    const attendanceRecords = await Attendance.find(query);

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "❌ No attendance records found" });
    }

    // ✅ Include the _id field in the response
    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,  // ✅ Add the MongoDB ID field
      mod_id: record.mod_id,
      class_name: record.class_name,
      poc_id: record.poc_id,
      date: record.date,
      present_count: record.present_count ?? 0,
      total_students: record.total_students ?? 1,
      attendanceRate: ((record.present_count / (record.total_students || 1)) * 100).toFixed(2) + "%"
    }));

    res.json(formattedRecords);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

//get by mod id and class name 
router.get("/get-by-mod-id-and-class-name", async (req, res) => {
  try {
    let { mod_id, class_name } = req.query;
    
    if (!mod_id || !class_name) {
      return res.status(400).json({ message: "❌ Missing mod_id or class_name in request." });
    }

    // Decode class_name to handle special characters
    class_name = decodeURIComponent(class_name);

    // Query for attendance data
    const attendanceRecords = await Attendance.find({ mod_id, class_name });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "❌ No attendance records found." });
    }

    res.status(200).json({ attendanceRecords });
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({ message: "❌ Internal server error." });
  }
});


router.post("/post-attendance", async (req, res) => {
  console.log("📥 Received POST request:", req.body);

  const { mod_id, class_name, poc_id, date, present_count, total_students } = req.body;

  if (![mod_id, class_name, poc_id, date, present_count, total_students].every(Boolean)) {
    return res.status(400).json({ error: "❌ All fields are required" });
  }

  try {
    const newRecord = new Attendance({
      mod_id,
      class_name,
      poc_id,
      date: new Date(date),
      present_count: Number(present_count),
      total_students: Number(total_students),
    });

    await newRecord.save();
    res.status(201).json({ message: "✅ Attendance recorded successfully" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT: Update attendance record using request body (no URL params)
router.put("/update-attendance", async (req, res) => {
  try {
    const { _id, mod_id, class_name, poc_id, date, present_count, total_students } = req.body;
    const id = _id; // Assign _id to id

    if (!id) {
      return res.status(400).json({ error: "❌ ID is required for updating" });
    }

    // ✅ Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "❌ Invalid ID format" });
    }

    // ✅ Prepare update object
    const updateData = {};
    if (mod_id) updateData.mod_id = mod_id;
    if (class_name) updateData.class_name = class_name;
    if (poc_id) updateData.poc_id = poc_id;
    if (date) updateData.date = new Date(date);
    if (present_count !== undefined) updateData.present_count = Number(present_count);
    if (total_students !== undefined) updateData.total_students = Number(total_students);

    // ✅ Ensure at least one field is updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "❌ No fields provided for update" });
    }

    // ✅ Update record
    const updatedRecord = await Attendance.findByIdAndUpdate(
      id,
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "❌ Attendance record not found" });
    }

    res.json({ message: "✅ Attendance updated successfully", updatedRecord });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});




  
// ✅ DELETE: Remove attendance record
router.delete("/delete-by-id:/id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await Attendance.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ error: "❌ Record not found" });
    }

    res.json({ message: "✅ Attendance deleted successfully" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;