import Quotation from "../models/quotation.js";
import QuotationCustomer from "../models/quotationCustomer.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONFIGURE MULTER ==========
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/quotations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `quotation-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

export const uploadImages = upload.array('images', 5);

// Helper function to generate quotation number
const generateQuotationNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const lastQuotation = await Quotation.findOne({ 
    quotationNumber: { $regex: `^Q-${year}${month}-` } 
  })
  .sort({ createdAt: -1 });
  
  let nextNumber = 1;
  if (lastQuotation && lastQuotation.quotationNumber) {
    const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[2]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return `Q-${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
};

// ✅ CREATE QUOTATION WITH ESTIMATE
export const createQuotation = async (req, res) => {
  try {
    console.log("📦 Creating quotation with data:", req.body);
    console.log("📸 Images received:", req.files);

    const {
      customer,
      items,
      validUntil,
      estimate
    } = req.body;

    // Validate required fields
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    if (!items) {
      return res.status(400).json({
        success: false,
        message: "Items are required"
      });
    }

    // Get admin info
    const adminId = req.admin._id;
    const adminName = req.admin.name;

    // Get customer details
    const customerData = await QuotationCustomer.findById(customer);
    if (!customerData) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Parse items if they come as string
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid items format"
      });
    }

    // Parse estimate if it comes as string
    let parsedEstimate = { low: 0, medium: 0, high: 0 };
    if (estimate) {
      try {
        parsedEstimate = typeof estimate === 'string' ? JSON.parse(estimate) : estimate;
      } catch (e) {
        console.log("Estimate parse error, using defaults");
      }
    }

    // Ensure parsedItems is an array
    if (!Array.isArray(parsedItems)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array"
      });
    }

    // Process items and ensure all required fields are present
    const processedItems = [];
    let grandTotal = 0;

    for (const item of parsedItems) {
      const processedMaterials = [];
      let itemSubtotal = 0;

      const materials = item.materials || [];

      for (const material of materials) {
        const quantity = parseFloat(material.quantity) || 0;
        const pricePerUnit = parseFloat(material.pricePerUnit) || 0;
        const materialTotal = quantity * pricePerUnit;

        itemSubtotal += materialTotal;

        processedMaterials.push({
          name: material.materialName || material.name || 'Unknown Material',
          quantity: quantity,
          unit: material.unit || 'piece',
          pricePerUnit: pricePerUnit,
          totalPrice: materialTotal
        });
      }

      processedItems.push({
        title: item.title || 'Quotation Item',
        notes: item.notes || '',
        materials: processedMaterials,
        subtotal: itemSubtotal
      });

      grandTotal += itemSubtotal;
    }

    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        const imageUrl = `/uploads/quotations/${file.filename}`;
        images.push({
          url: imageUrl,
          filename: file.filename,
          description: req.body[`imageDescription_${index}`] || '',
          uploadedAt: new Date()
        });
      });
    }

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber();

    // Create quotation with estimate
    const quotation = await Quotation.create({
      customer,
      customerName: customerData.name,
      customerPhone: customerData.phone,
      customerAddress: customerData.address || '',
      images,
      items: processedItems,
      grandTotal,
      quotationNumber,
      estimate: {
        low: parseFloat(parsedEstimate.low) || 0,
        medium: parseFloat(parsedEstimate.medium) || 0,
        high: parseFloat(parsedEstimate.high) || 0
      },
      validUntil: validUntil || new Date(+new Date() + 30*24*60*60*1000),
      createdBy: adminId,
      createdByAdmin: adminName,
      status: 'draft'
    });

    // Update customer's quotation count
    await QuotationCustomer.findByIdAndUpdate(customer, {
      $inc: { totalQuotations: 1 },
      lastQuotationDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation
    });

  } catch (error) {
    console.error("❌ Error creating quotation:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ PRINT QUOTATION WITHOUT COST
export const printQuotationWithoutCost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await Quotation.findById(id)
      .populate('customer', 'name phone address');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${quotation.quotationNumber}-without-cost.pdf`);
    
    doc.pipe(res);

    // Company Header
    doc.fontSize(20).font('Helvetica-Bold').text('QUOTATION', { align: 'center' });
    doc.moveDown();
    
    // Quotation Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Quotation #: ${quotation.quotationNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Customer Information');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${quotation.customerName}`);
    doc.text(`Phone: ${quotation.customerPhone}`);
    if (quotation.customerAddress) doc.text(`Address: ${quotation.customerAddress}`);
    doc.moveDown();

    // Items Table Header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Materials', 200, tableTop);
    doc.text('Quantity', 350, tableTop);
    doc.text('Unit', 450, tableTop);
    
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');

    let yPosition = doc.y;
    
    // Items
    quotation.items.forEach((item, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(item.title, 50, yPosition);
      yPosition += 20;
      
      item.materials.forEach(material => {
        doc.fontSize(9).font('Helvetica');
        doc.text('• ' + material.name, 70, yPosition);
        doc.text(material.quantity.toString(), 370, yPosition);
        doc.text(material.unit, 450, yPosition);
        yPosition += 15;
      });
      
      yPosition += 5;
    });

    // Terms
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, yPosition + 20);
    doc.fontSize(9).font('Helvetica').text(quotation.termsAndConditions, 50, yPosition + 35);

    doc.end();

  } catch (error) {
    console.error("❌ Error printing quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ PRINT QUOTATION WITH COST
export const printQuotationWithCost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await Quotation.findById(id)
      .populate('customer', 'name phone address');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${quotation.quotationNumber}-with-cost.pdf`);
    
    doc.pipe(res);

    // Company Header
    doc.fontSize(20).font('Helvetica-Bold').text('QUOTATION', { align: 'center' });
    doc.moveDown();
    
    // Quotation Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Quotation #: ${quotation.quotationNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Customer Information');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${quotation.customerName}`);
    doc.text(`Phone: ${quotation.customerPhone}`);
    if (quotation.customerAddress) doc.text(`Address: ${quotation.customerAddress}`);
    doc.moveDown();

    // Items Table Header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Materials', 150, tableTop);
    doc.text('Qty', 280, tableTop);
    doc.text('Rate', 330, tableTop);
    doc.text('Total', 400, tableTop);
    
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');

    let yPosition = doc.y;
    let grandTotal = 0;
    
    // Items
    quotation.items.forEach((item, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(item.title, 50, yPosition);
      yPosition += 20;
      
      item.materials.forEach(material => {
        doc.fontSize(9).font('Helvetica');
        doc.text('• ' + material.name, 70, yPosition);
        doc.text(material.quantity.toString(), 290, yPosition);
        doc.text(`Rs ${material.pricePerUnit}`, 330, yPosition);
        doc.text(`Rs ${material.totalPrice}`, 400, yPosition);
        yPosition += 15;
      });
      
      // Item Subtotal
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`Subtotal: Rs ${item.subtotal}`, 400, yPosition, { align: 'right' });
      yPosition += 20;
      grandTotal += item.subtotal;
    });

    // Grand Total
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Grand Total: Rs ${grandTotal}`, { align: 'right' });
    doc.moveDown();

    // ✅ Estimate Section
    if (quotation.estimate && (quotation.estimate.low > 0 || quotation.estimate.medium > 0 || quotation.estimate.high > 0)) {
      doc.fontSize(12).font('Helvetica-Bold').text('Project Estimate', 50, doc.y + 20);
      doc.moveDown();
      
      const estimateY = doc.y;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Low: Rs ${quotation.estimate.low}`, 70, estimateY);
      doc.text(`Medium: Rs ${quotation.estimate.medium}`, 200, estimateY);
      doc.text(`High: Rs ${quotation.estimate.high}`, 330, estimateY);
      doc.moveDown(2);
    }

    // Terms
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, doc.y + 10);
    doc.fontSize(9).font('Helvetica').text(quotation.termsAndConditions, 50, doc.y + 10);

    doc.end();

  } catch (error) {
    console.error("❌ Error printing quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET QUOTATION PDF DATA
export const getQuotationPdfData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await Quotation.findById(id)
      .populate('customer', 'name phone address');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });

  } catch (error) {
    console.error("❌ Error fetching quotation data:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ UPDATE QUOTATION
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quotation"
      });
    }

    const {
      items,
      validUntil,
      status,
      estimate
    } = req.body;

    // Parse and update items if provided
    if (items) {
      let parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      
      const processedItems = [];
      let grandTotal = 0;

      for (const item of parsedItems) {
        const processedMaterials = [];
        let itemSubtotal = 0;

        const materials = item.materials || [];

        for (const material of materials) {
          const quantity = parseFloat(material.quantity) || 0;
          const pricePerUnit = parseFloat(material.pricePerUnit) || 0;
          const materialTotal = quantity * pricePerUnit;

          itemSubtotal += materialTotal;

          processedMaterials.push({
            name: material.materialName || material.name || 'Unknown Material',
            quantity: quantity,
            unit: material.unit || 'piece',
            pricePerUnit: pricePerUnit,
            totalPrice: materialTotal
          });
        }

        processedItems.push({
          title: item.title || 'Quotation Item',
          notes: item.notes || '',
          materials: processedMaterials,
          subtotal: itemSubtotal
        });

        grandTotal += itemSubtotal;
      }

      quotation.items = processedItems;
      quotation.grandTotal = grandTotal;
    }

    // Update estimate if provided
    if (estimate) {
      let parsedEstimate = typeof estimate === 'string' ? JSON.parse(estimate) : estimate;
      quotation.estimate = {
        low: parseFloat(parsedEstimate.low) || 0,
        medium: parseFloat(parsedEstimate.medium) || 0,
        high: parseFloat(parsedEstimate.high) || 0
      };
    }

    // Update other fields
    if (validUntil) quotation.validUntil = validUntil;
    if (status) quotation.status = status;

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        const imageUrl = `/uploads/quotations/${file.filename}`;
        
        quotation.images.push({
          url: imageUrl,
          filename: file.filename,
          description: req.body[`imageDescription_${index}`] || '',
          uploadedAt: new Date()
        });
      });
    }

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: quotation
    });

  } catch (error) {
    console.error("❌ Error updating quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ DELETE IMAGE FROM QUOTATION
export const deleteQuotationImage = async (req, res) => {
  try {
    const { quotationId, imageId } = req.params;

    const quotation = await Quotation.findById(quotationId);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Find and remove image
    const imageIndex = quotation.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // Delete file from filesystem
    const image = quotation.images[imageIndex];
    const imagePath = path.join(__dirname, '../../', image.url);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove from array
    quotation.images.splice(imageIndex, 1);
    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET ALL QUOTATIONS
export const getAllQuotations = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const quotations = await Quotation.find({ createdBy: adminId })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });

  } catch (error) {
    console.error("❌ Error fetching quotations:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET QUOTATION BY ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer', 'name phone address');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this quotation"
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });

  } catch (error) {
    console.error("❌ Error fetching quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ DELETE QUOTATION
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quotation"
      });
    }

    // Delete associated images from filesystem
    if (quotation.images && quotation.images.length > 0) {
      quotation.images.forEach(image => {
        const imagePath = path.join(__dirname, '../../', image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await quotation.deleteOne();

    // Update customer's quotation count
    await QuotationCustomer.findByIdAndUpdate(quotation.customer, {
      $inc: { totalQuotations: -1 }
    });

    res.status(200).json({
      success: true,
      message: "Quotation deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ UPDATE QUOTATION STATUS
export const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    // Check authorization
    if (quotation.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quotation"
      });
    }

    quotation.status = status;
    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Quotation status updated successfully",
      data: quotation
    });

  } catch (error) {
    console.error("❌ Error updating quotation status:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET QUOTATIONS BY CUSTOMER
export const getQuotationsByCustomer = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const quotations = await Quotation.find({
      createdBy: adminId,
      customer: req.params.customerId
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });

  } catch (error) {
    console.error("❌ Error fetching customer quotations:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};