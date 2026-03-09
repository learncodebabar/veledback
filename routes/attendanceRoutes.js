import express from 'express';
import Attendance from '../models/Attendance.js';
import Labor from '../models/Labor.js';

const router = express.Router();

// ===========================================
// ATTENDANCE ROUTES
// ===========================================

// @route   POST /api/attendance/bulk
// @desc    Mark bulk attendance for multiple labors
router.post('/bulk', async (req, res) => {
  try {
    const { attendance } = req.body;

    console.log('📥 Received bulk attendance request:', attendance);

    // Validation
    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance list is required'
      });
    }

    const results = [];
    const errors = [];

    // Process each attendance record
    for (const item of attendance) {
      try {
        const { laborId, date, status } = item;

        // Basic validation
        if (!laborId || !date || !status) {
          errors.push({ 
            laborId, 
            error: 'Labor ID, date and status are required' 
          });
          continue;
        }

        // Check if labor exists
        const labor = await Labor.findById(laborId);
        if (!labor) {
          errors.push({ laborId, error: 'Labor not found' });
          continue;
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        
        const month = attendanceDate.getMonth() + 1; // JavaScript months are 0-based
        const year = attendanceDate.getFullYear();

        // Check if attendance already exists for this labor on this date
        const existingAttendance = await Attendance.findOne({
          laborId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingAttendance) {
          errors.push({ 
            laborId, 
            error: `Attendance already marked for ${attendanceDate.toDateString()}` 
          });
          continue;
        }

        // Create new attendance record
        const attendanceRecord = new Attendance({
          laborId,
          date: attendanceDate,
          status,
          month,
          year
        });

        await attendanceRecord.save();
        
        // Populate labor details for response
        await attendanceRecord.populate('laborId', 'name fatherName mobile perDayRate');

        results.push(attendanceRecord);
        console.log(`✅ Attendance marked for labor: ${laborId} - ${status}`);

      } catch (error) {
        console.error('Error processing attendance item:', error);
        errors.push({ 
          laborId: item.laborId, 
          error: error.message 
        });
      }
    }

    // Send response
    res.status(201).json({
      success: true,
      message: `✅ Successfully marked ${results.length} attendance records`,
      totalProcessed: attendance.length,
      successful: results.length,
      failed: errors.length,
      attendance: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error in bulk attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/single
// @desc    Mark single attendance
router.post('/single', async (req, res) => {
  try {
    const { laborId, date, status } = req.body;

    // Validation
    if (!laborId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Labor ID, date and status are required'
      });
    }

    // Check if labor exists
    const labor = await Labor.findById(laborId);
    if (!labor) {
      return res.status(404).json({
        success: false,
        message: 'Labor not found'
      });
    }

    // Parse date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const month = attendanceDate.getMonth() + 1;
    const year = attendanceDate.getFullYear();

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      laborId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      laborId,
      date: attendanceDate,
      status,
      month,
      year
    });

    await attendance.save();
    await attendance.populate('laborId', 'name fatherName mobile');

    res.status(201).json({
      success: true,
      message: '✅ Attendance marked successfully',
      attendance
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('laborId', 'name fatherName mobile perDayRate');

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      overtime: attendance.filter(a => a.status === 'Overtime').length,
      total: attendance.length
    };

    res.json({
      success: true,
      date: today,
      summary,
      attendance
    });

  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/date/:date
// @desc    Get attendance by specific date
router.get('/date/:date', async (req, res) => {
  try {
    const searchDate = new Date(req.params.date);
    searchDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendance = await Attendance.find({
      date: {
        $gte: searchDate,
        $lt: nextDay
      }
    }).populate('laborId', 'name fatherName mobile perDayRate');

    res.json({
      success: true,
      date: searchDate,
      count: attendance.length,
      attendance
    });

  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/month/:month/:year
// @desc    Get attendance for specific month
router.get('/month/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;

    const attendance = await Attendance.find({
      month: parseInt(month),
      year: parseInt(year)
    }).populate('laborId', 'name fatherName mobile perDayRate').sort({ date: -1 });

    // Group by labor for summary
    const groupedByLabor = {};
    attendance.forEach(record => {
      const laborId = record.laborId._id.toString();
      if (!groupedByLabor[laborId]) {
        groupedByLabor[laborId] = {
          labor: record.laborId,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            leave: 0,
            halfDay: 0,
            overtime: 0,
            totalDays: 0
          }
        };
      }
      
      groupedByLabor[laborId].records.push(record);
      
      if (record.status === 'Present') groupedByLabor[laborId].summary.present++;
      if (record.status === 'Absent') groupedByLabor[laborId].summary.absent++;
      if (record.status === 'Leave') groupedByLabor[laborId].summary.leave++;
      if (record.status === 'Half Day') groupedByLabor[laborId].summary.halfDay++;
      if (record.status === 'Overtime') groupedByLabor[laborId].summary.overtime++;
      
      groupedByLabor[laborId].summary.totalDays++;
    });

    res.json({
      success: true,
      month: parseInt(month),
      year: parseInt(year),
      totalRecords: attendance.length,
      groupedByLabor
    });

  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/labor/:laborId
// @desc    Get attendance for a specific labor
router.get('/labor/:laborId', async (req, res) => {
  try {
    const { laborId } = req.params;
    const { month, year } = req.query;

    let query = { laborId };

    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('laborId', 'name fatherName mobile perDayRate');

    // Get labor details
    const labor = await Labor.findById(laborId);

    if (!labor) {
      return res.status(404).json({
        success: false,
        message: 'Labor not found'
      });
    }

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      overtime: attendance.filter(a => a.status === 'Overtime').length,
      totalDays: attendance.length
    };

    res.json({
      success: true,
      labor: {
        id: labor._id,
        name: labor.name,
        fatherName: labor.fatherName,
        mobile: labor.mobile,
        perDayRate: labor.perDayRate
      },
      summary,
      attendance
    });

  } catch (error) {
    console.error('Error fetching labor attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Update status
    attendance.status = status || attendance.status;
    await attendance.save();
    await attendance.populate('laborId', 'name fatherName mobile');

    res.json({
      success: true,
      message: '✅ Attendance updated successfully',
      attendance
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: '✅ Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalActiveLabors = await Labor.countDocuments({ employmentStatus: 'Active' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const thisMonth = await Attendance.countDocuments({
      month: today.getMonth() + 1,
      year: today.getFullYear()
    });

    res.json({
      success: true,
      stats: {
        totalActiveLabors,
        todayAttendance,
        thisMonthAttendance: thisMonth,
        pendingToday: totalActiveLabors - todayAttendance
      }
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;