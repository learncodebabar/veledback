import express from 'express';
import Labor from '../models/Labor.js';

const router = express.Router();

// ===========================================
// POST /api/labor - Add new labor
// ===========================================
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received:', req.body);
    
    const { cnic, paymentType, monthlySalary, perDayRate } = req.body;
    
    // Basic validation
    if (!cnic) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC is required' 
      });
    }

    // Check if exists
    const existingLabor = await Labor.findOne({ cnic });
    if (existingLabor) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC already exists' 
      });
    }

    // Calculate daily wage HERE (not in middleware)
    let dailyWage = 0;
    if (paymentType === 'Monthly' && monthlySalary) {
      dailyWage = monthlySalary / 26;
    } else if (paymentType === 'Per Day' && perDayRate) {
      dailyWage = perDayRate;
    }

    // Create data with calculated dailyWage
    const laborData = {
      ...req.body,
      dailyWage: dailyWage
    };

    // Create and save
    const labor = new Labor(laborData);
    await labor.save();
    
    console.log('✅ Labor added:', labor._id);
    console.log('✅ Daily Wage:', dailyWage);

    res.status(201).json({
      success: true,
      message: 'Labor added successfully',
      labor
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Handle duplicate key
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// GET /api/labor - Get all labor
// ===========================================
router.get('/', async (req, res) => {
  try {
    const labor = await Labor.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: labor.length,
      labor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// ✅ GET /api/labor/:id - Get single labor by ID
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    console.log('📥 Fetching labor with ID:', req.params.id);
    
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid labor ID format'
      });
    }
    
    const labor = await Labor.findById(req.params.id);
    
    if (!labor) {
      console.log('❌ Labor not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Labor not found'
      });
    }
    
    console.log('✅ Labor found:', labor.name);
    res.json({
      success: true,
      labor
    });
    
  } catch (error) {
    console.error('❌ Error fetching labor:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// ✅ PUT /api/labor/:id - Update labor
// ===========================================
router.put('/:id', async (req, res) => {
  try {
    console.log('📥 Updating labor with ID:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid labor ID format'
      });
    }
    
    const { paymentType, monthlySalary, perDayRate } = req.body;
    
    // Recalculate daily wage if payment details changed
    let dailyWage = 0;
    if (paymentType === 'Monthly' && monthlySalary) {
      dailyWage = monthlySalary / 26;
    } else if (paymentType === 'Per Day' && perDayRate) {
      dailyWage = perDayRate;
    }
    
    // Add calculated dailyWage to update data
    const updateData = {
      ...req.body,
      dailyWage: dailyWage
    };
    
    const labor = await Labor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!labor) {
      return res.status(404).json({
        success: false,
        message: 'Labor not found'
      });
    }
    
    console.log('✅ Labor updated:', labor._id);
    res.json({
      success: true,
      message: 'Labor updated successfully',
      labor
    });
    
  } catch (error) {
    console.error('❌ Error updating labor:', error);
    
    // Handle duplicate key error for CNIC
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// ✅ DELETE /api/labor/:id - Delete labor
// ===========================================
router.delete('/:id', async (req, res) => {
  try {
    console.log('📥 Deleting labor with ID:', req.params.id);
    
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid labor ID format'
      });
    }
    
    const labor = await Labor.findByIdAndDelete(req.params.id);
    
    if (!labor) {
      return res.status(404).json({
        success: false,
        message: 'Labor not found'
      });
    }
    
    console.log('✅ Labor deleted:', labor._id);
    res.json({
      success: true,
      message: 'Labor deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting labor:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// ✅ GET /api/labor/search/:query - Search labor
// ===========================================
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    const labor = await Labor.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { fatherName: { $regex: searchQuery, $options: 'i' } },
        { cnic: { $regex: searchQuery, $options: 'i' } },
        { mobile: { $regex: searchQuery, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: labor.length,
      labor
    });
    
  } catch (error) {
    console.error('❌ Error searching labor:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===========================================
// ✅ GET /api/labor/status/:status - Get by status
// ===========================================
router.get('/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    
    const labor = await Labor.find({ employmentStatus: status })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: labor.length,
      labor
    });
    
  } catch (error) {
    console.error('❌ Error fetching labor by status:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

export default router;